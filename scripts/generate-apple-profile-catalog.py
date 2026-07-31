#!/usr/bin/env python3
"""Generate the React profile catalog from Apple's device-management schemas."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import yaml


def clean_type(value):
    if not isinstance(value, str):
        return "any"
    return value.strip().strip("<>")


def normalize_key(item, ancestors=None, depth=0):
    if not isinstance(item, dict) or not item.get("key"):
        return None

    ancestors = set() if ancestors is None else ancestors
    item_id = id(item)

    output = {
        "key": str(item["key"]),
        "title": str(item.get("title") or item["key"]),
        "type": clean_type(item.get("type")),
        "presence": str(item.get("presence") or "optional"),
    }

    for key in ("content", "default", "format", "rangelist", "range", "supportedOS", "subkeytype"):
        if key in item:
            output[key] = item[key]

    # Some Apple schemas use YAML aliases to describe recursive dictionary trees.
    # Keep the recursive field in the catalog without walking the object forever.
    if item_id in ancestors or depth >= 16:
        output["recursive"] = True
        return output

    next_ancestors = ancestors | {item_id}
    subkeys = [normalize_key(value, next_ancestors, depth + 1) for value in item.get("subkeys", [])]
    subkeys = [value for value in subkeys if value]
    if subkeys:
        output["subkeys"] = subkeys

    return output


def os_versions(readme):
    versions = {}
    for name, version in re.findall(r"\|\s*(iOS|macOS|tvOS|visionOS|watchOS)\s*\|\s*([^|]+?)\s*\|", readme):
        versions[name] = version.strip()
    return versions


def generate(source, destination):
    profiles_dir = source / "mdm" / "profiles"
    entries = []
    top_level = None

    for path in sorted(profiles_dir.glob("*.yaml")):
        document = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        payload = document.get("payload") or {}
        payload_type = payload.get("payloadtype")
        if not payload_type:
            continue

        entry = {
            "payloadType": str(payload_type),
            "title": str(document.get("title") or payload_type),
            "description": str(document.get("description") or ""),
            "supportedOS": payload.get("supportedOS") or {},
            "keys": [value for value in (normalize_key(item) for item in document.get("payloadkeys", [])) if value],
            "source": path.name,
        }

        if payload_type == "TopLevel":
            top_level = entry
        elif payload_type != "CommonPayloadKeys":
            entries.append(entry)

    entries.sort(key=lambda item: (item["title"].lower(), item["payloadType"].lower()))
    catalog = {
        "source": "https://github.com/apple/device-management",
        "branch": "release",
        "osVersions": os_versions((source / "README.md").read_text(encoding="utf-8")),
        "payloadCount": len(entries),
        "topLevel": top_level,
        "payloads": entries,
    }

    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Generated {len(entries)} payload schemas at {destination}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path, help="Apple device-management repository checkout")
    parser.add_argument("destination", type=Path, help="Generated JSON catalog")
    args = parser.parse_args()
    generate(args.source.resolve(), args.destination.resolve())


if __name__ == "__main__":
    main()
