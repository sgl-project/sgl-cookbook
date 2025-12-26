---
sidebar_position: 1
---

# Parallelism Configuration Guide

This guide explains the parallelism configuration fields used in SGLang model configurations and how they map to SGLang server command-line arguments.

## Quick Reference

| Config Field | SGLang CLI Argument | Description |
|--------------|---------------------|-------------|
| `tp` | `--tp-size`, `--tensor-parallel-size` | Tensor Parallelism - splits model across GPUs |
| `dp` | `--dp-size`, `--data-parallel-size` | Data Parallelism - runs multiple model replicas |
| `ep` | `--ep-size`, `--expert-parallel-size`, `--ep` | Expert Parallelism - distributes MoE experts |
| `enable_dp_attention` | `--enable-dp-attention` | DP for attention, TP for FFN (hybrid) |
