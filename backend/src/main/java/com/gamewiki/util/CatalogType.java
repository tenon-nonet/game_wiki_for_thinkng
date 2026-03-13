package com.gamewiki.util;

import java.util.List;

public enum CatalogType {
    ITEM,
    BOSS,
    NPC;

    public static final List<CatalogType> DISPLAY_ORDER = List.of(ITEM, BOSS, NPC);

    public static CatalogType from(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            throw new IllegalArgumentException("Catalog type is required");
        }
        try {
            return CatalogType.valueOf(rawValue.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unsupported catalog type: " + rawValue);
        }
    }
}
