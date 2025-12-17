# SGLang Model Configuration Manager

Interactive CLI tool for managing SGLang model configurations stored in YAML files.

## Overview

This tool provides a hierarchical navigation interface for creating and editing model configurations. It supports the following hierarchy:

```
Company → Family → Model → Hardware → Version → Configuration
```

## Installation

```bash
uv pip install -r requirements.txt
```

### Dependencies

- `pydantic>=2.0.0` - Data validation and settings management
- `pyyaml>=6.0` - YAML file parsing
- `questionary>=2.0.0` - Interactive CLI prompts
- `rich>=13.0.0` - Rich text formatting in terminal

## Usage

```bash
python main.py
```

### Navigation

- Use **arrow keys** to navigate menu options
- Press **Enter** to select
- Press **ESC** to go back to the parent level
- Select **[💾] Save and Exit** to save changes
