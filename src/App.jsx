import { useState, useEffect, useMemo, useCallback } from "react";
import styles from './App.module.css';

// Memoized link component to prevent unnecessary re-renders
const LinkItem = ({ link, isMobile }) => {
  const linkClass = `${styles.link} ${isMobile ? styles.mobile : ''}`;
  
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={linkClass}
    >
      {link.label}
    </a>
  );
};

export default function App() {
  const [config, setConfig] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Memoize URL parameter reading
  const userFromURL = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("user") || "default";
  }, []);

  // Optimize resize handler with useCallback
  const checkDevice = useCallback(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);

  // Device detection effect
  useEffect(() => {
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, [checkDevice]);

  // Config loading effect
  useEffect(() => {
    const controller = new AbortController(); // For request cancellation
    
    fetch(`${import.meta.env.BASE_URL}configs/${userFromURL}.json`, {
      signal: controller.signal
    })
      .then((res) => {
        if (!res.ok) throw new Error("配置文件加载失败");
        return res.json();
      })
      .then((data) => setConfig(data))
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error(err);
          setConfig({
            name: "未找到用户",
            bio: "请检查链接是否正确",
            avatar: "default.jpg",
            links: [],
          });
        }
      });

    return () => controller.abort(); // Cleanup
  }, [userFromURL]);

  // Loading state
  if (!config) {
    return <div className={styles.loading}>加载中...</div>;
  }

  const { name, bio, avatar, links } = config;

  // Memoize container and card classes
  const containerClass = `${styles.container} ${isMobile ? styles.mobile : ''}`;
  const cardClass = `${styles.card} ${isMobile ? styles.mobile : ''}`;
  const avatarClass = `${styles.avatar} ${isMobile ? styles.mobile : ''}`;
  const nameClass = `${styles.name} ${isMobile ? styles.mobile : ''}`;
  const bioClass = `${styles.bio} ${isMobile ? styles.mobile : ''}`;
  const linksClass = `${styles.linksContainer} ${isMobile ? styles.mobile : ''}`;

  return (
    <div className={containerClass}>
      <div className={cardClass}>
        {/* Optimized image with lazy loading */}
        <img
          src={import.meta.env.BASE_URL + avatar}
          alt="头像"
          className={avatarClass}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          style={{
            opacity: imageLoaded ? 1 : 0.7,
            transition: 'opacity 0.3s ease'
          }}
        />
        
        <h1 className={nameClass}>{name}</h1>
        
        <p className={bioClass}>{bio}</p>
        
        <div className={linksClass}>
          {links.map((link, i) => (
            <LinkItem 
              key={`${link.url}-${i}`} 
              link={link} 
              isMobile={isMobile} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
