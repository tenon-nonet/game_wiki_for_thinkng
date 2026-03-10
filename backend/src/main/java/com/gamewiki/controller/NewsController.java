package com.gamewiki.controller;

import lombok.Getter;
import lombok.Setter;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/news")
public class NewsController {

    @Getter
    @Setter
    public static class NewsItem {
        private String title;
        private String url;
        private String publishedAt;
        private String source;
    }

    @GetMapping
    public ResponseEntity<List<NewsItem>> getNews(@RequestParam String q,
                                                  @RequestParam(defaultValue = "10") int limit) {
        try {
            String encodedQ = java.net.URLEncoder.encode(q, java.nio.charset.StandardCharsets.UTF_8);
            String rssUrl = "https://news.google.com/rss/search?q=" + encodedQ + "&hl=ja&gl=JP&ceid=JP:ja";

            URL url = new URL(rssUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestProperty("User-Agent", "Mozilla/5.0");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);

            InputStream is = conn.getInputStream();
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(is);

            NodeList items = doc.getElementsByTagName("item");
            List<NewsItem> newsList = new ArrayList<>();

            DateTimeFormatter rssFormatter = DateTimeFormatter.ofPattern("EEE, dd MMM yyyy HH:mm:ss z", Locale.ENGLISH);
            int total = items.getLength();
            for (int i = 0; i < total; i++) {
                Element item = (Element) items.item(i);
                NewsItem news = new NewsItem();
                news.setTitle(getTagText(item, "title"));
                news.setUrl(getTagText(item, "link"));
                news.setPublishedAt(getTagText(item, "pubDate"));
                NodeList sourceNodes = item.getElementsByTagName("source");
                if (sourceNodes.getLength() > 0) {
                    news.setSource(sourceNodes.item(0).getTextContent());
                }
                newsList.add(news);
            }
            newsList.sort(Comparator.comparing((NewsItem n) -> {
                try {
                    return ZonedDateTime.parse(n.getPublishedAt(), rssFormatter);
                } catch (DateTimeParseException e) {
                    return ZonedDateTime.now().minusYears(10);
                }
            }).reversed());
            int cap = Math.min(limit, 100);
            return ResponseEntity.ok(newsList.subList(0, Math.min(newsList.size(), cap)));
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    private String getTagText(Element element, String tagName) {
        NodeList nodes = element.getElementsByTagName(tagName);
        if (nodes.getLength() > 0) {
            return nodes.item(0).getTextContent();
        }
        return "";
    }
}
