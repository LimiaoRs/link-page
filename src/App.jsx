import { useState } from "react";

export default function App() {
  const [name, setName] = useState("陈子阳");
  const [bio, setBio] = useState("江苏省 苏州市 | 苏州职业技术大学");
  const [avatar, setAvatar] = useState("/touxiang.jpg");
  ;
  const [links, setLinks] = useState([
    {
      label: "小红书",
      url: "https://www.xiaohongshu.com/user/profile/615a8f030000000002024081",
    },
    {
      label: "Bilibili",
      url: "https://b23.tv/Vhsu6b7",
    },
    {
      label: "抖音",
      url: "https://v.douyin.com/jls67xoyUC0/",
    },
  ]);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: 30,
          borderRadius: 20,
          maxWidth: 400,
          width: "100%",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        <img
          src={avatar}
          alt="头像"
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: 16,
          }}
        />
        <h1 style={{ margin: 0, fontSize: 24 }}>{name}</h1>
        <p
          style={{
            color: "#555",
            fontSize: 14,
            marginTop: 6,
            marginBottom: 20,
            lineHeight: 1.4,
          }}
        >
          {bio}
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
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
                padding: "10px 20px",
                borderRadius: 12,
                border: "1.5px solid #3b82f6",
                color: "#3b82f6",
                fontWeight: "600",
                textDecoration: "none",
                fontSize: 16,
                width: "80%",  // 让按钮宽度统一，且适合手机和电脑
                textAlign: "center",
                transition: "background-color 0.3s, color 0.3s",
                cursor: "pointer",
                userSelect: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#3b82f6";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#3b82f6";
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
