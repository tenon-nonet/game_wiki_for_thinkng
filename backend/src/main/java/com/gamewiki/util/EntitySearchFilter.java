package com.gamewiki.util;

import com.gamewiki.entity.Tag;

import java.util.List;
import java.util.Set;
import java.util.function.Function;

public final class EntitySearchFilter {

    private EntitySearchFilter() {
    }

    public static <T> List<T> apply(
            List<T> entities,
            String tagName,
            String keyword,
            Function<T, Set<Tag>> tagsExtractor,
            Function<T, String> nameExtractor,
            Function<T, String> descriptionExtractor
    ) {
        List<T> filtered = entities;
        if (tagName != null && !tagName.isBlank()) {
            filtered = filtered.stream()
                    .filter(entity -> tagsExtractor.apply(entity).stream()
                            .anyMatch(tag -> tag.getName().equalsIgnoreCase(tagName)))
                    .toList();
        }
        if (keyword != null && !keyword.isBlank()) {
            String lowerKeyword = keyword.toLowerCase();
            filtered = filtered.stream()
                    .filter(entity -> contains(nameExtractor.apply(entity), lowerKeyword)
                            || contains(descriptionExtractor.apply(entity), lowerKeyword))
                    .toList();
        }
        return filtered;
    }

    private static boolean contains(String value, String keyword) {
        return value != null && value.toLowerCase().contains(keyword);
    }
}
