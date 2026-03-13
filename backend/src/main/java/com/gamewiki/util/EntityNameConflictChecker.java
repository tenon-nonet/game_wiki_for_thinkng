package com.gamewiki.util;

import java.util.function.Function;

public final class EntityNameConflictChecker {

    private EntityNameConflictChecker() {
    }

    public static <T> boolean hasDuplicateName(
            Iterable<T> entities,
            Function<T, Long> idExtractor,
            Function<T, String> nameExtractor,
            String candidateName,
            Long selfId
    ) {
        String normalizedCandidate = NameNormalizer.normalize(candidateName);
        for (T entity : entities) {
            Long id = idExtractor.apply(entity);
            if (selfId != null && selfId.equals(id)) {
                continue;
            }
            if (NameNormalizer.normalize(nameExtractor.apply(entity)).equals(normalizedCandidate)) {
                return true;
            }
        }
        return false;
    }
}
