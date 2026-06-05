"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";

export default function KbArticlePage() {
  const { t } = useLocale();
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/kb/${slug}`).then(r=>r.json()).then(d=>{
      if (d.success) setArticle(d.data); else setNotFound(true);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <div style={{ maxWidth:760, margin:"0 auto" }}><div className="skeleton" style={{ height:400, borderRadius:"var(--radius-lg)" }}/></div>;
  if (notFound) return <div style={{ maxWidth:760, margin:"0 auto", textAlign:"center", padding:"60px 20px", color:"var(--text-muted)" }}>{t("Không tìm thấy bài viết.")} <Link href="/kb" style={{ color:"var(--accent)" }}>{t("← Về Kiến thức")}</Link></div>;

  return (
    <div style={{ maxWidth:760, margin:"0 auto" }}>
      <Link href="/kb" style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:13, color:"var(--text-muted)", textDecoration:"none", marginBottom:16 }}>{t("← Kiến thức")}</Link>
      <div style={{ fontSize:12, color:"var(--accent)", fontWeight:600, marginBottom:8 }}>{article.category?.name}</div>
      <h1 style={{ fontSize:24, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", marginBottom:8 }}>{article.title}</h1>
      <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:24 }}>{article.views} {t("lượt xem")}</div>
      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"28px", fontSize:14.5, color:"var(--text-primary)", lineHeight:1.75, whiteSpace:"pre-wrap" }}>
        {article.content}
      </div>
    </div>
  );
}
