import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useApp } from "@/shared/AppContext";
import { Body, Card, FloatingBadge, H1, H2, Pill, Screen, SectionLabel } from "@/shared/components";
import { contentDatabase } from "@/shared/knowledge/content";
import { ContentArticle } from "@/shared/knowledge/contentTypes";
import { palettes, spacing } from "@/shared/theme";

const categories = ["all", "education", "seasonal", "diet", "glow_up", "product_review", "motivation"];

export default function Blogs() {
  const { language, themeMode } = useApp();
  const c = palettes[themeMode];
  const [selectedCategory, setSelectedCategory] = useState("all");
  const articles = useMemo(
    () =>
      contentDatabase.articles.filter((article) => selectedCategory === "all" || article.category === selectedCategory),
    [selectedCategory]
  );
  const featured = articles[0] ?? contentDatabase.articles[0];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card variant="hero" style={styles.heroCard}>
          <View style={styles.heroTop}>
            <SectionLabel tone="accent">Skin Nepal blogs</SectionLabel>
            <Pill tone="secondary">{articles.length} reads</Pill>
          </View>
          <H1>{language === "en" ? "Pretty, practical skincare guides for Nepal" : "Nepal skincare guides"}</H1>
          <Body muted>
            Real routines for Kathmandu dust, Terai heat, mountain dryness, festivals, budget shopping, and skin confidence.
          </Body>
          <View style={styles.badgeRow}>
            <FloatingBadge label="Nepal-specific" />
            <FloatingBadge label="Budget-aware" tone="accent" />
            <FloatingBadge label="Seasonal care" tone="secondary" />
          </View>
        </Card>

        {featured ? (
          <Card variant="seasonal" style={styles.featuredCard}>
            <View style={styles.featuredVisual}>
              <Feather name="book-open" color={c.primary} size={30} />
            </View>
            <View style={styles.flex}>
              <Pill tone={toneForArticle(featured)}>{labelForCategory(featured.category)}</Pill>
              <H2>{titleForArticle(featured, language)}</H2>
              <Body muted>{featured.summary_en}</Body>
              <View style={styles.metaRow}>
                <Text style={[styles.metaText, { color: c.muted }]}>{featured.reading_time_min} min read</Text>
                <Text style={[styles.metaText, { color: c.muted }]}>Week {featured.content_calendar_week}</Text>
              </View>
            </View>
          </Card>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {categories.map((category) => {
            const active = selectedCategory === category;
            return (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={({ pressed }) => [
                  styles.categoryChip,
                  {
                    backgroundColor: active ? c.primary : c.surface,
                    borderColor: active ? c.primary : c.border,
                    transform: [{ scale: pressed ? 0.97 : 1 }]
                  }
                ]}
              >
                <Text style={[styles.categoryText, { color: active ? "#FFFFFF" : c.muted }]}>
                  {category === "all" ? "All" : labelForCategory(category)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.articleGrid}>
          {articles.map((article) => (
            <ArticleTile key={article.id} article={article} />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );

  function ArticleTile({ article }: { article: ContentArticle }) {
    return (
      <Card style={styles.articleTile}>
        <View style={[styles.articleVisual, { backgroundColor: visualBg(article, c) }]}>
          <Feather name={iconForArticle(article)} color={visualIcon(article, c)} size={24} />
        </View>
        <View style={styles.row}>
          <Pill tone={toneForArticle(article)}>{labelForCategory(article.category)}</Pill>
          <Text style={[styles.metaText, { color: c.muted }]}>{article.reading_time_min} min</Text>
        </View>
        <H2>{titleForArticle(article, language)}</H2>
        <Body muted>{article.summary_en}</Body>
      </Card>
    );
  }
}

function titleForArticle(article: ContentArticle, language: string) {
  return language === "ne" ? article.title_ne ?? article.title_en : article.title_en;
}

function labelForCategory(category: string) {
  return category.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toneForArticle(article: ContentArticle | string): "primary" | "secondary" | "accent" {
  const category = typeof article === "string" ? article : article.category;
  if (category === "diet" || category === "product_review") return "accent";
  if (category === "seasonal" || category === "motivation") return "secondary";
  return "primary";
}

function visualBg(article: ContentArticle, c: (typeof palettes)["light"]) {
  if (article.category === "seasonal" || article.category === "motivation") return c.secondarySoft;
  if (article.category === "diet" || article.category === "product_review") return c.accentSoft;
  return c.primarySoft;
}

function visualIcon(article: ContentArticle, c: (typeof palettes)["light"]) {
  if (article.category === "seasonal" || article.category === "motivation") return c.secondary;
  if (article.category === "diet" || article.category === "product_review") return c.accent;
  return c.primary;
}

function iconForArticle(article: ContentArticle): ComponentProps<typeof Feather>["name"] {
  if (article.category === "seasonal") return "cloud";
  if (article.category === "diet") return "coffee";
  if (article.category === "product_review") return "shopping-bag";
  if (article.category === "motivation") return "heart";
  return "book-open";
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: 120 },
  heroCard: { gap: spacing.sm },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  featuredCard: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  featuredVisual: {
    width: 82,
    height: 82,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.42)"
  },
  flex: { flex: 1, gap: spacing.xs },
  categoryRow: { gap: spacing.xs, paddingVertical: 2 },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center"
  },
  categoryText: { fontSize: 13, fontWeight: "800" },
  articleGrid: { gap: spacing.md },
  articleTile: { gap: spacing.sm },
  articleVisual: {
    height: 118,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  metaRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  metaText: { fontSize: 12, fontWeight: "800" }
});
