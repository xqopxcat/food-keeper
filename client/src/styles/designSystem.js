// 設計系統 - 高質感現代風格
export const DESIGN_SYSTEM = {
  // 顏色系統 - 更精緻的配色
  colors: {
    primary: {
      50: '#f0f9ff',   // 極淺藍
      100: '#e0f2fe',  // 淺藍
      500: '#0ea5e9',  // 主藍色 (現代專業感)
      600: '#0284c7',  // 深藍
      700: '#0369a1',  // 更深藍
      900: '#0c4a6e'   // 極深藍
    },
    secondary: {
      50: '#fafaf9',
      100: '#f5f5f4',
      500: '#78716c',
      600: '#57534e',
      700: '#44403c'
    },
    gray: {
      50: '#fafafb',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b'
    },
    white: '#ffffff',
    black: '#000000',
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
    info: '#3b82f6',
    
    // 高質感漸變
    gradients: {
      primary: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)',
      secondary: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      soft: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
    }
  },

  // 間距系統
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },

  // 圓角系統
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '9999px'
  },

  // 陰影系統 - 更細緻的陰影
  shadows: {
    none: 'none',
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    
    // 特殊陰影效果
    glow: '0 0 20px rgb(14 165 233 / 0.15)',
    card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    button: '0 2px 4px -1px rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
    floating: '0 25px 50px -12px rgb(0 0 0 / 0.25)'
  },

  // 字體系統
  typography: {
    sizes: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px'
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }
  },

  // 佈局系統 - 響應式設計
  layout: {
    headerHeight: '64px',
    bottomNavHeight: '80px',
    
    // 響應式容器
    containerMaxWidth: {
      mobile: '100%',
      tablet: '768px',
      desktop: '1200px'
    },
    containerPadding: {
      mobile: '16px',
      tablet: '24px',
      desktop: '32px'
    },
    
    // 網格系統
    grid: {
      mobile: 'repeat(1, 1fr)',
      tablet: 'repeat(2, 1fr)',
      desktop: 'repeat(4, 1fr)'
    }
  }
};

// 常用樣式組合
export const COMMON_STYLES = {
  // 主要按鈕 - 高質感設計
  primaryButton: {
    background: DESIGN_SYSTEM.colors.gradients.primary,
    color: DESIGN_SYSTEM.colors.white,
    padding: `${DESIGN_SYSTEM.spacing.md} ${DESIGN_SYSTEM.spacing.lg}`,
    borderRadius: DESIGN_SYSTEM.borderRadius.xl,
    border: 'none',
    fontSize: DESIGN_SYSTEM.typography.sizes.base,
    fontWeight: DESIGN_SYSTEM.typography.weights.semibold,
    boxShadow: DESIGN_SYSTEM.shadows.button,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DESIGN_SYSTEM.spacing.sm,
    position: 'relative',
    overflow: 'hidden'
  },

  // 次要按鈕 - 高質感設計
  secondaryButton: {
    background: DESIGN_SYSTEM.colors.gradients.soft,
    color: DESIGN_SYSTEM.colors.gray[700],
    padding: `${DESIGN_SYSTEM.spacing.md} ${DESIGN_SYSTEM.spacing.lg}`,
    borderRadius: DESIGN_SYSTEM.borderRadius.xl,
    border: `1px solid ${DESIGN_SYSTEM.colors.gray[200]}`,
    fontSize: DESIGN_SYSTEM.typography.sizes.base,
    fontWeight: DESIGN_SYSTEM.typography.weights.medium,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DESIGN_SYSTEM.spacing.sm,
    boxShadow: DESIGN_SYSTEM.shadows.sm
  },

  // 卡片容器 - 高質感設計
  card: {
    backgroundColor: DESIGN_SYSTEM.colors.white,
    borderRadius: DESIGN_SYSTEM.borderRadius.xl,
    padding: DESIGN_SYSTEM.spacing.lg,
    boxShadow: DESIGN_SYSTEM.shadows.card,
    border: `1px solid ${DESIGN_SYSTEM.colors.gray[100]}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden'
  },

  // 輸入框
  input: {
    width: '100%',
    padding: `${DESIGN_SYSTEM.spacing.md} ${DESIGN_SYSTEM.spacing.lg}`,
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    border: `1px solid ${DESIGN_SYSTEM.colors.gray[200]}`,
    fontSize: DESIGN_SYSTEM.typography.sizes.base,
    backgroundColor: DESIGN_SYSTEM.colors.white,
    transition: 'border-color 0.2s ease',
    outline: 'none'
  },

  // 容器 - 響應式
  container: {
    width: '100%',
    maxWidth: '100%',
    margin: '0 auto',
    padding: `0 ${DESIGN_SYSTEM.layout.containerPadding.mobile}`,
    boxSizing: 'border-box',
    
    // 平板樣式
    '@media (min-width: 768px)': {
      maxWidth: DESIGN_SYSTEM.layout.containerMaxWidth.tablet,
      padding: `0 ${DESIGN_SYSTEM.layout.containerPadding.tablet}`
    },
    
    // 桌面樣式  
    '@media (min-width: 1024px)': {
      maxWidth: DESIGN_SYSTEM.layout.containerMaxWidth.desktop,
      padding: `0 ${DESIGN_SYSTEM.layout.containerPadding.desktop}`
    }
  },

  // 頁面容器 - 響應式
  pageContainer: {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: DESIGN_SYSTEM.colors.white,
    position: 'relative',
    margin: 0,
    padding: 0,
    paddingBottom: DESIGN_SYSTEM.layout.bottomNavHeight
  },

  // 頭部
  header: {
    height: DESIGN_SYSTEM.layout.headerHeight,
    backgroundColor: DESIGN_SYSTEM.colors.white,
    borderBottom: `1px solid ${DESIGN_SYSTEM.colors.gray[100]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `0 ${DESIGN_SYSTEM.layout.containerPadding}`,
    position: 'sticky',
    top: 0,
    zIndex: 10
  }
};

// 響應式斷點
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px'
};

// 動畫
export const ANIMATIONS = {
  fadeIn: {
    opacity: 0,
    animation: 'fadeIn 0.3s ease forwards'
  },
  slideUp: {
    transform: 'translateY(20px)',
    opacity: 0,
    animation: 'slideUp 0.3s ease forwards'
  },
  bounce: {
    animation: 'bounce 0.6s ease'
  }
};

// 響應式工具函數
export const getResponsiveStyle = (mobileValue, tabletValue, desktopValue) => ({
  ...mobileValue,
  '@media (min-width: 768px)': tabletValue || mobileValue,
  '@media (min-width: 1024px)': desktopValue || tabletValue || mobileValue
});

export const RESPONSIVE_GRIDS = {
  statsCards: {
    mobile: 'repeat(2, 1fr)',
    tablet: 'repeat(4, 1fr)', 
    desktop: 'repeat(4, 1fr)'
  },
  inventory: {
    mobile: 'repeat(1, 1fr)',
    tablet: 'repeat(1, 1fr)',
    desktop: 'repeat(2, 1fr)'
  },
  actions: {
    mobile: 'repeat(1, 1fr)',
    tablet: 'repeat(2, 1fr)',
    desktop: 'repeat(2, 1fr)'
  }
};

// CSS 關鍵幀動畫 (需要注入到 global CSS)
export const CSS_KEYFRAMES = `
@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    transform: translate3d(0, -8px, 0);
  }
  70% {
    transform: translate3d(0, -4px, 0);
  }
  90% {
    transform: translate3d(0, -2px, 0);
  }
}

/* 滾動條樣式 */
::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-track {
  background: ${DESIGN_SYSTEM.colors.gray[50]};
}

::-webkit-scrollbar-thumb {
  background: ${DESIGN_SYSTEM.colors.gray[300]};
  border-radius: ${DESIGN_SYSTEM.borderRadius.full};
}

::-webkit-scrollbar-thumb:hover {
  background: ${DESIGN_SYSTEM.colors.gray[400]};
}
`;