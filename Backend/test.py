# extract_codebase_structure.py
import os
import ast

def parse_python_file(filepath):
    """Extract classes and functions from a Python file."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            tree = ast.parse(f.read(), filename=filepath)
    except Exception as e:
        return [f"⚠️ Could not parse ({e})"]

    structures = []
    for node in ast.iter_child_nodes(tree):
        if isinstance(node, ast.ClassDef):
            structures.append(f"class {node.name} (line {node.lineno})")
            for child in node.body:
                if isinstance(child, ast.FunctionDef):
                    structures.append(f"  └── def {child.name}() (line {child.lineno})")
        elif isinstance(node, ast.FunctionDef):
            structures.append(f"def {node.name}() (line {node.lineno})")
    return structures


def walk_codebase(base_dir="."):
    """Walk through the project and extract structure."""
    structure = []
    for root, _, files in os.walk(base_dir):
        # Ignore hidden dirs (like .git, __pycache__)
        if any(skip in root for skip in [".git", "__pycache__", "venv", ".venv"]):
            continue

        py_files = [f for f in files if f.endswith(".py")]
        if py_files:
            structure.append(f"\n📂 {root}")
            for file in py_files:
                filepath = os.path.join(root, file)
                structure.append(f"  📄 {file}")
                for item in parse_python_file(filepath):
                    structure.append(f"     {item}")
    return structure


if __name__ == "__main__":
    base_dir = "."  # or replace with your backend path
    struct = walk_codebase(base_dir)
    output_file = "codebase_structure.txt"

    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(struct))

    print(f"✅ Codebase structure saved to {output_file}")
