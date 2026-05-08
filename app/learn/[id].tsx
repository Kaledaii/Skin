import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useApp } from "@/shared/AppContext";
import { Body, Card, H1, H2, Pill, Screen, SectionLabel } from "@/shared/components";
import { getArticleById } from "@/shared/knowledge/content";
import { glossaryTerms, nutrientGuides } from "@/shared/knowledge/education";
import { trackEvent } from "@/shared/services/analytics";
import { palettes, spacing } from "@/shared/theme";

export default function ArticleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language, themeMode } = useApp();
  const c = palettes[themeMode];
  const article = getArticleById(id ?? "");
  const title = article ? (language === "ne" ? article.title_ne ?? article.title_en : article.title_en) : "Article not found";
  const articleTerms = glossaryTerms.filter((term) => article?.glossary_terms?.includes(term.id));
  const articleNutrients = nutrientGuides.filter((nutrient) => article?.nutrient_ids?.includes(nutrient.id));

  useEffect(() => {
    if (article) {
      trackEvent("article_opened", { id: article.id, category: article.category });
    }
  }, [article]);

  return (
    <Screen>
      <Stack.Screen options={{ title: "Learn" }} />
      <ScrollView contentContainerStyle={styles.content}>
        {!article ? (
          <Card>
            <H1>Article not found</H1>
            <Body muted>This guide may have moved. Go back to Learn and open another article.</Body>
          </Card>
        ) : (
          <>
            <Card variant="hero">
              <SectionLabel tone="accent">{article.category.replace(/_/g, " ")}</SectionLabel>
              <H1>{title}</H1>
              <Body muted>{article.summary_en}</Body>
              <View style={styles.row}>
                <Pill tone="primary">{article.reading_time_min} min read</Pill>
                <Pill tone="secondary">Guidance, not diagnosis</Pill>
              </View>
            </Card>

            {article.takeaways?.length ? (
              <Card>
                <H2>Key takeaways</H2>
                {article.takeaways.map((takeaway) => (
                  <Body key={takeaway}>• {takeaway}</Body>
                ))}
              </Card>
            ) : null}

            {article.sections?.map((section) => (
              <Card key={section.heading_en}>
                <H2>{language === "ne" ? section.heading_ne ?? section.heading_en : section.heading_en}</H2>
                <Body>{language === "ne" ? section.body_ne ?? section.body_en : section.body_en}</Body>
                {section.bullets?.map((bullet) => (
                  <Body key={bullet} muted>• {bullet}</Body>
                ))}
              </Card>
            ))}

            {articleTerms.length > 0 ? (
              <Card>
                <H2>Words used here</H2>
                {articleTerms.map((term) => (
                  <View key={term.id} style={[styles.tile, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
                    <Pill tone="primary">{term.term}</Pill>
                    <Body>{term.meaning_en}</Body>
                    <Body muted>{term.meaning_ne}</Body>
                  </View>
                ))}
              </Card>
            ) : null}

            {articleNutrients.length > 0 ? (
              <Card>
                <H2>Nutrients connected to this guide</H2>
                {articleNutrients.map((nutrient) => (
                  <View key={nutrient.id} style={[styles.tile, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
                    <Pill tone="secondary">{nutrient.name}</Pill>
                    <Body>{nutrient.skin_benefit}</Body>
                    <Body muted>{nutrient.nepali_foods.join(", ")}</Body>
                  </View>
                ))}
              </Card>
            ) : null}

            <Card>
              <H2>When to see a dermatologist</H2>
              <Body>{article.when_to_see_doctor ?? "See a dermatologist if symptoms are painful, spreading, scarring, or not improving."}</Body>
              <Body muted>{article.source_notes?.join(" • ")}</Body>
            </Card>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  tile: { borderWidth: 1, borderRadius: 14, padding: spacing.md, gap: spacing.xs, marginTop: spacing.xs }
});
