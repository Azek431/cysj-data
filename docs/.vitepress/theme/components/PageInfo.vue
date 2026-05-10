<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useData } from "vitepress";

const { page, frontmatter } = useData();

const wordCount = ref(0);
const readingTime = ref(0);

const showPageInfo = computed(() => {
  return (
    frontmatter.value.layout !== "home" && frontmatter.value.meta !== false
  );
});

const title = computed(() => {
  return frontmatter.value.title || page.value.title || "未命名文档";
});

const description = computed(() => {
  return (
    frontmatter.value.description ||
    "这是一篇创游世界资料库文档，正在持续整理、校对与优化中。"
  );
});

const author = computed(() => {
  return frontmatter.value.editor || frontmatter.value.author || "Azek431";
});

const authorUrl = computed(() => {
  return (
    frontmatter.value.editorUrl ||
    frontmatter.value.authorUrl ||
    "https://github.com/Azek431"
  );
});

const authorGithub = computed(() => {
  return frontmatter.value.editorGithub || "https://github.com/Azek431";
});

const authorEmail = computed(() => {
  return frontmatter.value.editorEmail || "";
});

const status = computed(() => frontmatter.value.status || "持续维护");
const difficulty = computed(() => frontmatter.value.difficulty || "未标注");
const evidence = computed(
  () => frontmatter.value.evidence || frontmatter.value.source || "资料整理",
);
const category = computed(() => frontmatter.value.category || "知识库文档");
const version = computed(() => frontmatter.value.version || "v0.1.x");

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
  ) {
    return "success";
  }

  return "info";
});

const evidenceType = computed(() => {
  const value = String(evidence.value);

  if (value.includes("E1") || value.includes("官方")) return "success";
  if (value.includes("待验证") || value.includes("E4")) return "warning";
  if (value.includes("OCR") || value.includes("截图") || value.includes("E2"))
    return "purple";
  if (value.includes("归纳") || value.includes("E3") || value.includes("社区"))
    return "info";

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
  <section v-if="showPageInfo" class="cysj-page-info cysj-page-info--v4">
    <div class="cysj-page-info__ambient ambient-one"></div>
    <div class="cysj-page-info__ambient ambient-two"></div>

    <div class="cysj-page-info__top">
      <div class="cysj-page-info__main">
        <div class="cysj-page-info__badge">Knowledge Profile</div>
        <h2 class="cysj-page-info__title">{{ title }}</h2>
        <p class="cysj-page-info__desc">{{ description }}</p>
      </div>

      <div class="cysj-page-info__state" :class="`is-${statusType}`">
        <span class="cysj-page-info__state-dot"></span>
        {{ status }}
      </div>
    </div>

    <div class="cysj-page-info__metrics">
      <div class="cysj-page-info__metric is-author">
        <span class="cysj-page-info__icon">👤</span>
        <div>
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

              <span v-if="!authorEmail" class="cysj-author__hint">
                可通过 GitHub Issue 联系维护者
              </span>
            </span>
          </span>
        </div>
      </div>

      <div class="cysj-page-info__metric">
        <span class="cysj-page-info__icon">🕒</span>
        <div>
          <span class="cysj-page-info__label">最后更新</span>
          <span class="cysj-page-info__value">{{ updated || "待补充" }}</span>
        </div>
      </div>

      <div class="cysj-page-info__metric">
        <span class="cysj-page-info__icon">⏱️</span>
        <div>
          <span class="cysj-page-info__label">阅读时长</span>
          <span class="cysj-page-info__value">
            <template v-if="readingTime">约 {{ readingTime }} 分钟</template>
            <template v-else>计算中</template>
          </span>
        </div>
      </div>

      <div class="cysj-page-info__metric">
        <span class="cysj-page-info__icon">📄</span>
        <div>
          <span class="cysj-page-info__label">文档规模</span>
          <span class="cysj-page-info__value">
            <template v-if="wordCount">约 {{ wordCount }} 字</template>
            <template v-else>计算中</template>
          </span>
        </div>
      </div>
    </div>

    <div class="cysj-page-info__facts">
      <span class="cysj-fact">
        <span>难度</span>
        <strong>{{ difficulty }}</strong>
      </span>

      <span class="cysj-fact">
        <span>分类</span>
        <strong>{{ category }}</strong>
      </span>

      <span class="cysj-fact">
        <span>版本</span>
        <strong>{{ version }}</strong>
      </span>

      <span class="cysj-fact evidence" :class="`is-${evidenceType}`">
        <span>证据</span>
        <strong>{{ evidence }}</strong>
      </span>
    </div>

    <div v-if="tags.length" class="cysj-page-info__tags">
      <span v-for="tag in tags" :key="tag" class="cysj-tag"> #{{ tag }} </span>
    </div>
  </section>
</template>
