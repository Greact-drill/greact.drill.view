import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMediaConfig, presignDownload } from "../../api/media";
import "./DocumentsPage.css";

interface MediaAsset {
  id: string;
  name?: string;
  group?: string;
  type: "image" | "video" | "document";
  url?: string;
  key?: string;
  contentType?: string;
}

interface DocumentsConfigData {
  assets?: MediaAsset[];
}

export default function DocumentsPage() {
  const params = useParams();
  const rigId = params.rigId || "14820";
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const loadDocuments = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const config = await getMediaConfig<DocumentsConfigData>("documents", rigId);
        const normalized = (config.data?.assets ?? [])
          .map(asset => ({
            id: String(asset.id || "").trim(),
            name: asset.name?.trim() || "",
            group: asset.group?.trim() || "",
            type: asset.type || "document",
            url: asset.url?.trim() || "",
            key: asset.key,
            contentType: asset.contentType
          }))
          .filter(asset => asset.id && (asset.url || asset.key) && asset.type === "document");
        if (isActive) {
          setAssets(normalized);
        }
      } catch {
        if (isActive) {
          setErrorMessage("Не удалось загрузить документы для выбранной буровой.");
          setAssets([]);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadDocuments();
    return () => {
      isActive = false;
    };
  }, [rigId]);

  useEffect(() => {
    let isActive = true;
    const resolvePresigned = async () => {
      if (assets.length === 0) return;
      if (assets.every(asset => !asset.key)) return;
      const updated = await Promise.all(
        assets.map(async asset => {
          if (!asset.key) return asset;
          try {
            const presign = await presignDownload({ key: asset.key, expiresIn: 3600 });
            return { ...asset, url: presign.url };
          } catch {
            return asset;
          }
        })
      );
      const hasUpdates = updated.some((asset, index) => asset.url !== assets[index]?.url);
      if (isActive && hasUpdates) {
        setAssets(updated);
      }
    };

    resolvePresigned();
    return () => {
      isActive = false;
    };
  }, [assets]);

  const groupedDocuments = useMemo(() => {
    return assets.reduce<Record<string, MediaAsset[]>>((acc, asset) => {
      const groupName = asset.group || "Основные документы";
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(asset);
      return acc;
    }, {});
  }, [assets]);

  const totalDocuments = assets.length;

  return (
    <div className="documents-page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="documents-page-title">Документы буровой</h1>
          <p className="documents-page-subtitle">Единый архив технических материалов</p>
        </div>
      </div>

      <div className="documents-page-nav">
        <Link to={`/rigs/${rigId}`} className="documents-nav-link">
          <i className="pi pi-arrow-left" />
          <span>Назад к буровой</span>
        </Link>
      </div>

      <div className="documents-layout">
        <section className="documents-list-section">
          <div className="documents-list-header">
            <div>
              <h3 className="documents-list-title">Каталог документов</h3>
              <p className="documents-list-subtitle">Файлы относятся только к выбранной буровой</p>
            </div>
            <div className="documents-count">
              <span className="documents-count-label">Всего</span>
              <span className="documents-count-value">{totalDocuments}</span>
            </div>
          </div>

          {loading && <div className="documents-empty">Загрузка документов...</div>}
          {!loading && errorMessage && <div className="documents-error">{errorMessage}</div>}
          {!loading && !errorMessage && totalDocuments === 0 && (
            <div className="documents-empty">
              Документы пока не добавлены. Загрузите их через админ-панель.
            </div>
          )}

          {!loading && !errorMessage && totalDocuments > 0 && (
            <div className="documents-groups">
              {Object.entries(groupedDocuments).map(([group, items]) => (
                <div className="documents-group" key={group}>
                  <div className="documents-group-title">{group}</div>
                  <div className="documents-grid">
                    {items.map(doc => (
                      <div className="document-card" key={doc.id}>
                        <div className="document-card-icon">
                          <i className="pi pi-file" />
                        </div>
                        <div className="document-card-content">
                          <div className="document-card-title">{doc.name || doc.id}</div>
                          <div className="document-card-meta">
                            {doc.contentType || "Документ"}
                          </div>
                        </div>
                        <div className="document-card-actions">
                          {doc.url ? (
                            <>
                              <a
                                className="document-card-link"
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Открыть
                              </a>
                              <a
                                className="document-card-link secondary"
                                href={doc.url}
                                download
                              >
                                Скачать
                              </a>
                            </>
                          ) : (
                            <span className="document-card-link disabled">Нет ссылки</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="documents-info-panel">
          <div className="info-section">
            <h3 className="info-title">Справка</h3>
            <div className="documents-info-list">
              <div className="info-row">
                <span className="info-label">Буровая</span>
                <span className="info-value">#{rigId}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Документов</span>
                <span className="info-value">{totalDocuments || "—"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Групп</span>
                <span className="info-value">{Object.keys(groupedDocuments).length || "—"}</span>
              </div>
            </div>
          </div>
          <div className="info-section">
            <h3 className="info-title">Совет</h3>
            <div className="documents-tip">
              Сортируйте документы по группам в админ-панели, чтобы быстро находить нужные файлы.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
