import { useState, useEffect } from "react";

export default function App() {
  const [config, setConfig] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // 读取 URL 参数中的 user=xxx
  const getUserFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("user") || "default"; // 默认读取 default.json
  };

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  useEffect(() => {
    const user = getUserFromURL();
    fetch(`${import.meta.env.BASE_URL}configs/${user}.json`)
      .then((res) => {
        if (!res.ok) throw new Error("配置文件加载失败");
        return res.json();
      })
      .then((data) => setConfig(data))
      .catch((err) => {
        console.error(err);
        setConfig({
          name: "未找到用户",
          bio: "请检查链接是否正确",
          avatar: "default.jpg",
          links: [],
        });
      });
  }, []);

  if (!config) {
    return <p style={{ textAlign: "center", marginTop: 100 }}>加载中...</p>;
  }

  const { name, bio, avatar, links } = config;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
        padding: isMobile ? 15 : 40,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: isMobile ? 25 : 40,
          borderRadius: isMobile ? 16 : 24,
          maxWidth: isMobile ? "100%" : 480,
          width: "100%",
          boxShadow: isMobile
            ? "0 4px 15px rgba(0,0,0,0.1)"
            : "0 8px 30px rgba(0,0,0,0.12)",
          textAlign: "center",
          boxSizing: "border-box",
          transform: isMobile ? "none" : "scale(1.05)",
        }}
      >
        <img
          src={import.meta.env.BASE_URL + avatar}
          alt="头像"
          style={{
            width: isMobile ? 100 : 120,
            height: isMobile ? 100 : 120,
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: isMobile ? 16 : 20,
            border: "3px solid #f0f0f0",
          }}
        />
        <h1
          style={{
            margin: 0,
            fontSize: isMobile ? 24 : 28,
            fontWeight: "700",
            color: "#2d3748",
            marginBottom: 8,
          }}
        >
          {name}
        </h1>
        <p
          style={{
            color: "#666",
            fontSize: isMobile ? 14 : 16,
            marginTop: 0,
            marginBottom: isMobile ? 24 : 32,
            lineHeight: 1.5,
            fontWeight: "500",
          }}
        >
          {bio}
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? 12 : 16,
            alignItems: "center",
          }}
        >
          {links.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: isMobile ? "12px 24px" : "16px 32px",
                borderRadius: isMobile ? 12 : 16,
                border: "2px solid #3b82f6",
                color: "#3b82f6",
                fontWeight: "600",
                textDecoration: "none",
                fontSize: isMobile ? 16 : 18,
                width: isMobile ? "85%" : "75%",
                textAlign: "center",
                transition: "all 0.3s ease",
                cursor: "pointer",
                userSelect: "none",
                background:
                  "linear-gradient(135deg, transparent 0%, rgba(59, 130, 246, 0.05) 100%)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#3b82f6";
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(59, 130, 246, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#3b82f6";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
