#!/usr/bin/env python3
"""
Model Configuration Manager CLI

Interactive CLI tool for managing SGLang model configurations.
Supports hierarchical navigation through companies, families, models, hardware, versions, and configurations.

Usage:
    python main.py
"""

from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Optional
import copy

import questionary
from questionary import Style
from prompt_toolkit.keys import Keys
from rich.console import Console
from rich.panel import Panel
from rich.text import Text

from models import (
    CompanyConfig,
    ModelFamily,
    Model,
    HardwareConfig,
    VersionConfig,
)
from prompts import (
    print_header,
    print_success,
    print_error,
    print_info,
    prompt_add_company,
    prompt_add_family,
    prompt_add_model,
    prompt_add_hardware_type,
    prompt_add_version,
    prompt_add_configuration,
    prompt_edit_configuration,
    edit_in_editor,
)
from yaml_handler import (
    list_company_files,
    load_company_config,
    load_company_config_raw,
    save_company_config,
    get_company_file_path,
    validate_config,
    generate_change_summary,
)

console = Console()

# Custom style for questionary
custom_style = Style([
    ('qmark', 'fg:cyan bold'),
    ('question', 'bold'),
    ('answer', 'fg:cyan bold'),
    ('pointer', 'fg:cyan bold'),
    ('highlighted', 'fg:cyan bold'),
    ('selected', 'fg:green'),
])


def select_with_esc(message: str, choices: list, **kwargs) -> any:
    """
    A wrapper around questionary.select that adds ESC key support.

    When ESC is pressed, returns None (same as Ctrl+C).
    """
    from questionary.prompts.common import InquirerControl
    from prompt_toolkit.application import Application
    from prompt_toolkit.layout import Layout
    from prompt_toolkit.layout.containers import HSplit, Window
    from prompt_toolkit.layout.controls import FormattedTextControl

    # Create the select question
    question = questionary.select(message, choices, **kwargs)

    # Get the underlying application
    app = question.application

    # Add ESC key binding to the existing key bindings
    @app.key_bindings.add(Keys.Escape, eager=True)
    def handle_escape(event):
        event.app.exit(result=None)

    # Run the modified application
    try:
        return app.run()
    except KeyboardInterrupt:
        return None


class NavigationLevel(Enum):
    """Enum representing navigation hierarchy levels"""
    COMPANY = "company"
    FAMILY = "family"
    MODEL = "model"
    HARDWARE = "hardware"
    VERSION = "version"
    CONFIGURATION = "configuration"


@dataclass
class NavigationState:
    """State for tracking navigation through the hierarchy"""
    config: CompanyConfig
    file_path: Path
    original_data: Optional[dict] = None  # For change tracking

    # Current selection indices/keys at each level
    family_idx: Optional[int] = None
    model_idx: Optional[int] = None
    hardware_key: Optional[str] = None
    version_key: Optional[str] = None
    config_idx: Optional[int] = None

    @property
    def current_family(self) -> Optional[ModelFamily]:
        if (self.family_idx is not None
            and 0 <= self.family_idx < len(self.config.families)):
            return self.config.families[self.family_idx]
        return None

    @property
    def current_model(self) -> Optional[Model]:
        family = self.current_family
        if (family and self.model_idx is not None
            and 0 <= self.model_idx < len(family.models)):
            return family.models[self.model_idx]
        return None

    @property
    def current_hardware(self) -> Optional[HardwareConfig]:
        model = self.current_model
        if model and self.hardware_key and self.hardware_key in model.hardware:
            return model.hardware[self.hardware_key]
        return None

    @property
    def current_version(self) -> Optional[VersionConfig]:
        hardware = self.current_hardware
        if hardware and self.version_key and self.version_key in hardware.versions:
            return hardware.versions[self.version_key]
        return None

    def get_breadcrumb(self) -> str:
        """Generate breadcrumb path string"""
        parts = [self.config.company]

        if self.current_family:
            parts.append(self.current_family.name)
        if self.current_model:
            parts.append(self.current_model.name)
        if self.hardware_key:
            parts.append(self.hardware_key)
        if self.version_key:
            parts.append(self.version_key)

        return " > ".join(parts)


class ConfigManagerCLI:
    """Main CLI class with hierarchical navigation"""

    # Special choice values
    GO_BACK = "__GO_BACK__"
    ADD_NEW = "__ADD_NEW__"
    SAVE_EXIT = "__SAVE_EXIT__"
    EXIT_NO_SAVE = "__EXIT_NO_SAVE__"
    EDIT_EDITOR = "__EDIT_EDITOR__"
    EDIT_ITEM = "__EDIT__"
    DELETE_ITEM = "__DELETE__"

    def __init__(self):
        self.state: Optional[NavigationState] = None

    def print_breadcrumb(self) -> None:
        """Print the current navigation path"""
        if self.state:
            breadcrumb = self.state.get_breadcrumb()
            console.print(Text(f"\n📍 {breadcrumb}", style="bold cyan"))
            console.print("─" * (len(breadcrumb) + 4))

    def make_select(self, message: str, choices: list, show_back: bool = True) -> Optional[str]:
        """Create a select prompt with standard options.

        ESC key will return GO_BACK to navigate to the parent level.
        """
        if show_back:
            choices.append(questionary.Choice(
                title="[ESC] Go to upper level",
                value=self.GO_BACK
            ))

        try:
            # Use custom select with ESC key support
            result = select_with_esc(
                message,
                choices=choices,
                style=custom_style,
                use_shortcuts=False,
            )

            # Handle Ctrl+C or ESC (both return None)
            if result is None:
                return self.GO_BACK
            return result
        except KeyboardInterrupt:
            return self.GO_BACK

    def run(self) -> None:
        """Main entry point"""
        console.print(Panel.fit(
            "[bold blue]SGLang Model Configuration Manager[/bold blue]\n"
            "Interactive tool for managing model configurations\n"
            "[dim]Press ESC or select 'Go back' to navigate up[/dim]",
            border_style="blue"
        ))

        # Start with company selection
        self.company_level()

    def company_level(self) -> None:
        """Company selection level - the root level"""
        while True:
            console.print("\n[bold]Select or Create Company[/bold]")

            company_files = list_company_files()
            choices = []

            for f in company_files:
                try:
                    config = load_company_config(f)
                    family_count = len(config.families)
                    choices.append(questionary.Choice(
                        title=f"{config.company} ({family_count} families)",
                        value=("existing", config, f)
                    ))
                except Exception as e:
                    print_error(f"Error loading {f.name}: {e}")

            choices.extend([
                questionary.Choice(title="[+] Create New Company", value=self.ADD_NEW),
                questionary.Choice(title="[Exit] Quit", value=self.EXIT_NO_SAVE),
            ])

            result = select_with_esc(
                "Select a company:",
                choices=choices,
                style=custom_style,
            )

            if result is None or result == self.EXIT_NO_SAVE:
                print_info("Goodbye!")
                return

            if result == self.ADD_NEW:
                new_config = prompt_add_company()
                if new_config:
                    file_path = get_company_file_path(new_config.company)
                    self.state = NavigationState(
                        config=new_config,
                        file_path=file_path,
                        original_data=None  # New file
                    )
                    print_success(f"Created new company: {new_config.company}")
                    self.family_level()
                continue

            # Existing company selected
            _, config, file_path = result
            original_data = load_company_config_raw(file_path)
            self.state = NavigationState(
                config=config,
                file_path=file_path,
                original_data=original_data
            )
            print_success(f"Loaded: {config.company}")
            self.family_level()

    def family_level(self) -> None:
        """Family list level"""
        while True:
            self.print_breadcrumb()

            choices = []
            families = self.state.config.families

            for i, family in enumerate(families):
                model_count = len(family.models)
                desc = f" - {family.description}" if family.description else ""
                choices.append(questionary.Choice(
                    title=f"{family.name} ({model_count} models){desc}",
                    value=("select", i)
                ))

            choices.extend([
                questionary.Choice(title="[+] Add New Family", value=self.ADD_NEW),
                questionary.Choice(title="[x] Delete a Family", value=self.DELETE_ITEM),
                questionary.Choice(title="[💾] Save and Exit", value=self.SAVE_EXIT),
            ])

            result = self.make_select(
                f"Families in {self.state.config.company}:",
                choices,
                show_back=True
            )

            if result == self.GO_BACK:
                # Check for unsaved changes before going back
                if self._has_unsaved_changes():
                    if not self._confirm_discard_changes():
                        continue
                return

            if result == self.SAVE_EXIT:
                self._save_with_summary()
                return

            if result == self.ADD_NEW:
                family = prompt_add_family()
                if family:
                    self.state.config.families.append(family)
                    print_success(f"Added family: {family.name}")
                continue

            if result == self.DELETE_ITEM:
                self._delete_family()
                continue

            # Family selected
            action, idx = result
            self.state.family_idx = idx
            self.state.model_idx = None
            self.state.hardware_key = None
            self.state.version_key = None
            self.model_level()

    def model_level(self) -> None:
        """Model list level"""
        while True:
            self.print_breadcrumb()

            family = self.state.current_family
            if not family:
                return

            choices = []
            for i, model in enumerate(family.models):
                hw_count = len(model.hardware)
                choices.append(questionary.Choice(
                    title=f"{model.name} ({hw_count} hardware configs)",
                    value=("select", i)
                ))

            choices.extend([
                questionary.Choice(title="[+] Add New Model", value=self.ADD_NEW),
                questionary.Choice(title="[x] Delete a Model", value=self.DELETE_ITEM),
            ])

            result = self.make_select(
                f"Models in {family.name}:",
                choices,
                show_back=True
            )

            if result == self.GO_BACK:
                self.state.family_idx = None
                return

            if result == self.ADD_NEW:
                model = prompt_add_model(self.state.config.company)
                if model:
                    family.models.append(model)
                    print_success(f"Added model: {model.name}")
                continue

            if result == self.DELETE_ITEM:
                self._delete_model(family)
                continue

            # Model selected
            action, idx = result
            self.state.model_idx = idx
            self.state.hardware_key = None
            self.state.version_key = None
            self.hardware_level()

    def hardware_level(self) -> None:
        """Hardware list level"""
        while True:
            self.print_breadcrumb()

            model = self.state.current_model
            if not model:
                return

            choices = []
            for hw_name, hw_config in model.hardware.items():
                version_count = len(hw_config.versions)
                choices.append(questionary.Choice(
                    title=f"{hw_name} ({version_count} versions)",
                    value=("select", hw_name)
                ))

            choices.append(questionary.Choice(
                title="[+] Add New Hardware",
                value=self.ADD_NEW
            ))

            result = self.make_select(
                f"Hardware for {model.name}:",
                choices,
                show_back=True
            )

            if result == self.GO_BACK:
                self.state.model_idx = None
                return

            if result == self.ADD_NEW:
                hw_type = prompt_add_hardware_type(model)
                if hw_type:
                    print_success(f"Added hardware: {hw_type}")
                continue

            # Hardware selected
            action, hw_key = result
            self.state.hardware_key = hw_key
            self.state.version_key = None
            self.version_level()

    def version_level(self) -> None:
        """Version list level"""
        while True:
            self.print_breadcrumb()

            hardware = self.state.current_hardware
            if not hardware:
                return

            choices = []
            for ver_name, ver_config in hardware.versions.items():
                cfg_count = len(ver_config.configurations)
                choices.append(questionary.Choice(
                    title=f"{ver_name} ({cfg_count} configurations)",
                    value=("select", ver_name)
                ))

            choices.append(questionary.Choice(
                title="[+] Add New Version",
                value=self.ADD_NEW
            ))

            result = self.make_select(
                f"SGLang Versions for {self.state.hardware_key}:",
                choices,
                show_back=True
            )

            if result == self.GO_BACK:
                self.state.hardware_key = None
                return

            if result == self.ADD_NEW:
                version = prompt_add_version(hardware)
                if version:
                    print_success(f"Added version: {version}")
                continue

            # Version selected
            action, ver_key = result
            self.state.version_key = ver_key
            self.configuration_level()

    def configuration_level(self) -> None:
        """Configuration list level - the leaf level"""
        while True:
            self.print_breadcrumb()

            version = self.state.current_version
            if not version:
                return

            choices = []
            for i, cfg in enumerate(version.configurations):
                # Build description string
                desc_parts = [cfg.attributes.optimization]
                if cfg.engine:
                    desc_parts.append(f"tp={cfg.engine.tp}")
                    if cfg.engine.dp:
                        desc_parts.append(f"dp={cfg.engine.dp}")
                desc_parts.append(cfg.attributes.quantization)

                choices.append(questionary.Choice(
                    title=f"{cfg.name} ({', '.join(desc_parts)})",
                    value=("select", i)
                ))

            choices.append(questionary.Choice(
                title="[+] Add New Configuration",
                value=self.ADD_NEW
            ))

            result = self.make_select(
                f"Configurations for {self.state.version_key}:",
                choices,
                show_back=True
            )

            if result == self.GO_BACK:
                self.state.version_key = None
                return

            if result == self.ADD_NEW:
                configuration = prompt_add_configuration()
                if configuration:
                    version.configurations.append(configuration)
                    print_success(f"Added configuration: {configuration.name}")
                continue

            # Configuration selected - show details and edit options
            action, cfg_idx = result
            self._show_configuration_details(cfg_idx)

    def _show_configuration_details(self, cfg_idx: int) -> None:
        """Show configuration details and edit/delete options"""
        version = self.state.current_version
        if not version or cfg_idx >= len(version.configurations):
            return

        cfg = version.configurations[cfg_idx]

        # Display current configuration
        console.print(Panel.fit(
            f"[bold]{cfg.name}[/bold]\n\n"
            f"[cyan]Attributes:[/cyan]\n"
            f"  Nodes: {cfg.attributes.nodes}\n"
            f"  Optimization: {cfg.attributes.optimization}\n"
            f"  Quantization: {cfg.attributes.quantization}\n\n"
            f"[cyan]Engine:[/cyan]\n"
            f"  TP: {cfg.engine.tp}\n"
            f"  DP: {cfg.engine.dp or 'N/A'}\n"
            f"  EP: {cfg.engine.ep or 'N/A'}\n"
            f"  DP Attention: {cfg.engine.enable_dp_attention or False}\n"
            f"  Env Vars: {cfg.engine.env_vars or '{}'}\n"
            f"  Extra Args: {cfg.engine.extra_args or '[]'}\n\n"
            f"[cyan]Batch Sizes:[/cyan]\n"
            f"  Prefill: {cfg.prefill.max_batch_size if cfg.prefill else 'N/A'}\n"
            f"  Decode: {cfg.decode.max_batch_size if cfg.decode else 'N/A'}",
            title=f"Configuration: {cfg.name}",
            border_style="green"
        ))

        choices = [
            questionary.Choice(title="[Edit in Editor] Open in vim/editor", value=self.EDIT_EDITOR),
            questionary.Choice(title="[Edit] Edit field by field", value=self.EDIT_ITEM),
            questionary.Choice(title="[Delete] Delete this configuration", value=self.DELETE_ITEM),
        ]

        result = self.make_select("Actions:", choices, show_back=True)

        if result == self.EDIT_EDITOR:
            updated = edit_in_editor(cfg)
            if updated:
                version.configurations[cfg_idx] = updated
                print_success(f"Updated configuration: {updated.name}")
            else:
                print_info("Edit cancelled or validation failed")

        elif result == self.EDIT_ITEM:
            updated = prompt_edit_configuration(cfg)
            if updated:
                version.configurations[cfg_idx] = updated
                print_success(f"Updated configuration: {updated.name}")

        elif result == self.DELETE_ITEM:
            if questionary.confirm(
                f"Delete configuration '{cfg.name}'?",
                default=False
            ).ask():
                version.configurations.pop(cfg_idx)
                print_success(f"Deleted configuration: {cfg.name}")

    def _delete_family(self) -> None:
        """Delete a family from the company"""
        families = self.state.config.families
        if not families:
            print_info("No families to delete.")
            return

        choices = [
            questionary.Choice(
                title=f"{f.name} ({len(f.models)} models)",
                value=i
            )
            for i, f in enumerate(families)
        ]
        choices.append(questionary.Choice(title="[Cancel]", value=None))

        result = select_with_esc(
            "Select family to delete:",
            choices=choices,
            style=custom_style,
        )

        if result is None:
            return

        family = families[result]
        if questionary.confirm(
            f"Delete family '{family.name}' and all its models?",
            default=False
        ).ask():
            families.pop(result)
            print_success(f"Deleted family: {family.name}")

    def _delete_model(self, family: ModelFamily) -> None:
        """Delete a model from a family"""
        if not family.models:
            print_info("No models to delete.")
            return

        choices = [
            questionary.Choice(
                title=f"{m.name} ({len(m.hardware)} hardware configs)",
                value=i
            )
            for i, m in enumerate(family.models)
        ]
        choices.append(questionary.Choice(title="[Cancel]", value=None))

        result = select_with_esc(
            "Select model to delete:",
            choices=choices,
            style=custom_style,
        )

        if result is None:
            return

        model = family.models[result]
        if questionary.confirm(
            f"Delete model '{model.name}' and all its configurations?",
            default=False
        ).ask():
            family.models.pop(result)
            print_success(f"Deleted model: {model.name}")

    def _has_unsaved_changes(self) -> bool:
        """Check if there are unsaved changes"""
        if not self.state:
            return False

        summary = generate_change_summary(
            self.state.original_data,
            self.state.config,
            self.state.file_path
        )
        return summary['has_changes']

    def _confirm_discard_changes(self) -> bool:
        """Ask user to confirm discarding changes"""
        return questionary.confirm(
            "You have unsaved changes. Discard and go back?",
            default=False
        ).ask() or False

    def _save_with_summary(self) -> None:
        """Save with validation and change summary"""
        if not self.state:
            return

        # Run validation
        console.print("\n[bold]Validating configuration...[/bold]")
        errors = validate_config(self.state.config)

        if errors:
            console.print(Panel(
                "\n".join([f"• {err}" for err in errors]),
                title="[red]Validation Errors[/red]",
                border_style="red"
            ))

            if not questionary.confirm("Save anyway (not recommended)?", default=False).ask():
                print_info("Save cancelled.")
                return
        else:
            print_success("Validation passed!")

        # Generate and display change summary
        summary = generate_change_summary(
            self.state.original_data,
            self.state.config,
            self.state.file_path
        )

        if not summary['has_changes']:
            print_info("No changes to save.")
            return

        # Build summary panel
        summary_lines = []

        if summary['added']:
            summary_lines.append("[green]Added:[/green]")
            for item in summary['added']:
                summary_lines.append(f"  [green]+ {item}[/green]")

        if summary['modified']:
            summary_lines.append("[yellow]Modified:[/yellow]")
            for item in summary['modified']:
                summary_lines.append(f"  [yellow]~ {item}[/yellow]")

        if summary['removed']:
            summary_lines.append("[red]Removed:[/red]")
            for item in summary['removed']:
                summary_lines.append(f"  [red]- {item}[/red]")

        console.print(Panel(
            "\n".join(summary_lines),
            title="[bold]Change Summary[/bold]",
            subtitle=f"File: {summary['file']}",
            border_style="blue"
        ))

        # Confirm save
        if questionary.confirm("Save these changes?", default=True).ask():
            save_company_config(self.state.config, self.state.file_path)
            print_success(f"Configuration saved to: {self.state.file_path}")
        else:
            print_info("Save cancelled.")


def run_cli():
    """Main entry point"""
    cli = ConfigManagerCLI()
    cli.run()


if __name__ == "__main__":
    run_cli()
