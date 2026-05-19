<script setup lang="ts">
const { dashboard } = useDashboardState();
</script>

<template>
  <PageHeader
    description="Every autonomous action writes an audit event, including generated findings and recommendation decisions."
    eyebrow="Traceability"
    title="Audit timeline"
  />
  <AuditTimeline v-if="dashboard" :events="dashboard.auditEvents" />
</template>
