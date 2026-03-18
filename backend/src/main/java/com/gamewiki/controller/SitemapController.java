package com.gamewiki.controller;

import com.gamewiki.repository.BossRepository;
import com.gamewiki.repository.GameRepository;
import com.gamewiki.repository.ItemRepository;
import com.gamewiki.repository.NpcRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class SitemapController {

    private static final String BASE_URL = "https://fromdex.com";

    private final GameRepository gameRepository;
    private final BossRepository bossRepository;
    private final NpcRepository npcRepository;
    private final ItemRepository itemRepository;

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> sitemap() {
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        // 静的ページ
        addUrl(xml, BASE_URL + "/", "weekly", "1.0");
        addUrl(xml, BASE_URL + "/catalog", "daily", "0.9");
        addUrl(xml, BASE_URL + "/items", "daily", "0.8");
        addUrl(xml, BASE_URL + "/bosses", "daily", "0.8");
        addUrl(xml, BASE_URL + "/npcs", "daily", "0.8");
        addUrl(xml, BASE_URL + "/relation-graph", "weekly", "0.7");
        addUrl(xml, BASE_URL + "/board", "daily", "0.7");

        // ゲーム詳細
        gameRepository.findAllByVisibleTrueOrderBySortOrderAscIdAsc().forEach(g -> {
            addUrl(xml, BASE_URL + "/games/" + g.getId(), "weekly", "0.9");
            addUrl(xml, BASE_URL + "/games/" + g.getId() + "/relation-graph", "weekly", "0.7");
        });

        // ボス詳細
        bossRepository.findAllByOrderBySortOrderAscIdAsc().forEach(b ->
            addUrl(xml, BASE_URL + "/bosses/" + b.getId(), "monthly", "0.8")
        );

        // NPC詳細
        npcRepository.findAllByOrderBySortOrderAscIdAsc().forEach(n ->
            addUrl(xml, BASE_URL + "/npcs/" + n.getId(), "monthly", "0.8")
        );

        // アイテム詳細
        itemRepository.findAllByOrderBySortOrderAscIdAsc().forEach(i ->
            addUrl(xml, BASE_URL + "/items/" + i.getId(), "monthly", "0.7")
        );

        xml.append("</urlset>");
        return ResponseEntity.ok(xml.toString());
    }

    private void addUrl(StringBuilder xml, String loc, String changefreq, String priority) {
        xml.append("  <url>\n");
        xml.append("    <loc>").append(loc).append("</loc>\n");
        xml.append("    <changefreq>").append(changefreq).append("</changefreq>\n");
        xml.append("    <priority>").append(priority).append("</priority>\n");
        xml.append("  </url>\n");
    }
}
