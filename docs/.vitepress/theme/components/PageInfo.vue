<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useData } from "vitepress";

const { page, frontmatter } = useData();

const wordCount = ref(0);
const readingTime = ref(0);

const isHome = computed(() => frontmatter.value.layout === "home");
const title = computed(
  () => frontmatter.value.title || page.value.title || "未命名文档",
);
const description = computed(() => frontmatter.value.description || "");

const author = computed(
  () => frontmatter.value.editor || frontmatter.value.author || "Azek431",
);
const authorUrl = computed(
  () =>
    frontmatter.value.editorUrl ||
    frontmatter.value.authorUrl ||
    "https://github.com/Azek431",
);
const authorGithub = computed(
  () => frontmatter.value.editorGithub || "https://github.com/Azek431",
);
const authorEmail = computed(() => frontmatter.value.editorEmail || "");

const status = computed(() => frontmatter.value.status || "持续维护");
const difficulty = computed(() => frontmatter.value.difficulty || "");
const evidence = computed(
  () => frontmatter.value.evidence || frontmatter.value.source || "",
);
const category = computed(() => frontmatter.value.category || "");
const version = computed(() => frontmatter.value.version || "");

const tags = computed(() => {
  const value = frontmatter.value.tags;
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return [value];
  return [];
});

const formatDate = (value: unknown) => {
  if (!value) return "";

  if (typeof value === "number") {
    return new Date(value).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  const date = new Date(String(value));
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  return String(value);
};

const updated = computed(() => {
  return formatDate(frontmatter.value.updated || page.value.lastUpdated);
});

const statusType = computed(() => {
  const value = String(status.value);

  if (value.includes("待验证") || value.includes("草稿")) return "warning";
  if (value.includes("旧") || value.includes("过期") || value.includes("废弃"))
    return "danger";
  if (
    value.includes("已整理") ||
    value.includes("完成") ||
    value.includes("稳定") ||
    value.includes("已复核")
  )
    return "success";

  return "info";
});

const evidenceType = computed(() => {
  const value = String(evidence.value);

  if (value.includes("E1") || value.includes("官方")) return "success";
  if (value.includes("待验证") || value.includes("E4")) return "warning";
  if (value.includes("OCR") || value.includes("截图") || value.includes("E2"))
    return "purple";
  if (value.includes("归纳") || value.includes("E3")) return "info";

  return "neutral";
});

onMounted(() => {
  const content = document.querySelector(".vp-doc");
  const text = content?.textContent?.replace(/\s+/g, "").trim() || "";

  if (text) {
    wordCount.value = text.length;
    readingTime.value = Math.max(1, Math.ceil(text.length / 500));
  }
});
</script>

<template>
  <section v-if="!isHome && frontmatter.meta !== false" class="cysj-page-info">
    <div class="cysj-page-info__glow"></div>

    <div class="cysj-page-info__head">
      <div>
        <p class="cysj-page-info__kicker">文档档案</p>
        <h2 class="cysj-page-info__title">{{ title }}</h2>
      </div>

      <span class="cysj-page-info__status" :class="`is-${statusType}`">
        {{ status }}
      </span>
    </div>

    <p v-if="description" class="cysj-page-info__desc">
      {{ description }}
    </p>

    <div class="cysj-page-info__grid">
      <div class="cysj-page-info__item is-author">
        <span class="cysj-page-info__label">维护者</span>

        <span class="cysj-author">
          <a
            class="cysj-author__link"
            :href="authorUrl"
            target="_blank"
            rel="noreferrer"
          >
            {{ author }}
            <span>↗</span>
          </a>

          <span class="cysj-author__card">
            <strong>维护者信息</strong>

            <a :href="authorGithub" target="_blank" rel="noreferrer">
              GitHub：Azek431
            </a>

            <a v-if="authorEmail" :href="`mailto:${authorEmail}`">
              邮箱：{{ authorEmail }}
            </a>
          </span>
        </span>
      </div>

      <div class="cysj-page-info__item">
        <span class="cysj-page-info__label">最后更新</span>
        <span class="cysj-page-info__value">{{ updated || "待补充" }}</span>
      </div>

      <div class="cysj-page-info__item">
        <span class="cysj-page-info__label">阅读时长</span>
        <span class="cysj-page-info__value">
          <template v-if="readingTime">约 {{ readingTime }} 分钟</template>
          <template v-else>计算中</template>
        </span>
      </div>

      <div class="cysj-page-info__item">
        <span class="cysj-page-info__label">文档字数</span>
        <span class="cysj-page-info__value">
          <template v-if="wordCount">约 {{ wordCount }} 字</template>
          <template v-else>计算中</template>
        </span>
      </div>

      <div v-if="difficulty" class="cysj-page-info__item">
        <span class="cysj-page-info__label">阅读难度</span>
        <span class="cysj-page-info__value">{{ difficulty }}</span>
      </div>

      <div v-if="category" class="cysj-page-info__item">
        <span class="cysj-page-info__label">所属分类</span>
        <span class="cysj-page-info__value">{{ category }}</span>
      </div>

      <div v-if="version" class="cysj-page-info__item">
        <span class="cysj-page-info__label">适用版本</span>
        <span class="cysj-page-info__value">{{ version }}</span>
      </div>

      <div v-if="evidence" class="cysj-page-info__item">
        <span class="cysj-page-info__label">证据等级</span>
        <span
          class="cysj-page-info__value evidence"
          :class="`is-${evidenceType}`"
        >
          {{ evidence }}
        </span>
      </div>
    </div>

    <div v-if="tags.length" class="cysj-page-info__tags">
      <span v-for="tag in tags" :key="tag" class="cysj-tag"> #{{ tag }} </span>
    </div>
  </section>
</template>
