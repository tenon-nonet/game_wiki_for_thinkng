package com.gamewiki.util;

import java.text.Normalizer;
import java.util.Locale;

public final class NameNormalizer {

    private NameNormalizer() {
    }

    public static String normalize(String value) {
        if (value == null) return "";
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFKC)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[\\s\\u3000]+", "");
        return normalized.trim();
    }
}

