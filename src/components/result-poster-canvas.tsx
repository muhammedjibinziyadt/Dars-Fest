"use client";

interface PrizeEntry {
  position: number;
  studentName?: string;
  teamName?: string;
  chestNumber?: string;
}

interface PosterData {
  programName: string;
  section?: string;
  prizes: PrizeEntry[];
}

export type PosterStyle = 1 | 2 | 3;

/**
 * Load image from URL and return as Image element
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Get gradient colors for different poster styles
 */
function getGradientColors(style: PosterStyle) {
  switch (style) {
    case 1:
      // Default purple gradient
      return {
        stops: [
          { offset: 0, color: "#1e1b4b" }, // Deep purple
          { offset: 0.3, color: "#312e81" }, // Indigo
          { offset: 0.7, color: "#581c87" }, // Purple
          { offset: 1, color: "#4c1d95" }, // Dark purple
        ],
        sectionColor: "#fbbf24", // Gold
      };
    case 2:
      // Blue gradient
      return {
        stops: [
          { offset: 0, color: "#0f172a" }, // Slate
          { offset: 0.3, color: "#1e3a8a" }, // Blue
          { offset: 0.7, color: "#3b82f6" }, // Light blue
          { offset: 1, color: "#1e40af" }, // Dark blue
        ],
        sectionColor: "#60a5fa", // Light blue
      };
    case 3:
      // Emerald/Teal gradient
      return {
        stops: [
          { offset: 0, color: "#064e3b" }, // Dark emerald
          { offset: 0.3, color: "#065f46" }, // Emerald
          { offset: 0.7, color: "#059669" }, // Light emerald
          { offset: 1, color: "#047857" }, // Dark emerald
        ],
        sectionColor: "#34d399", // Emerald
      };
    default:
      return {
        stops: [
          { offset: 0, color: "#1e1b4b" },
          { offset: 0.3, color: "#312e81" },
          { offset: 0.7, color: "#581c87" },
          { offset: 1, color: "#4c1d95" },
        ],
        sectionColor: "#fbbf24",
      };
  }
}

interface StyleTheme {
  templateUrl: string;
  fallbackUrls: string[];
  titleColor: string;
  sectionColor: string;
  pos1Color: string;
  pos2Color: string;
  pos3Color: string;
}

function getStyleTheme(style: PosterStyle): StyleTheme {
  switch (style) {
    case 1:
      // Style 1: Classic Cream (Official Festival Template)
      return {
        templateUrl: "/img/result-poster-1.png",
        fallbackUrls: ["/img/result-poster.png", "/img/RESULT POSTER.png"],
        titleColor: "#1e1b4b", // Deep navy
        sectionColor: "#b91c1c", // Crimson red
        pos1Color: "#b91c1c", // Red
        pos2Color: "#0260a8", // Blue
        pos3Color: "#b45309", // Amber
      };
    case 2:
      // Style 2: Royal Blue Edition
      return {
        templateUrl: "/img/result-poster-2.png",
        fallbackUrls: ["/img/result-poster-1.png", "/img/result-poster.png", "/img/RESULT POSTER.png"],
        titleColor: "#0f2952", // Deep navy/indigo
        sectionColor: "#0284c7", // Sky blue
        pos1Color: "#0284c7", // Blue
        pos2Color: "#15803d", // Green
        pos3Color: "#0369a1", // Deep sky blue
      };
    case 3:
      // Style 3: Emerald Green Edition
      return {
        templateUrl: "/img/result-poster-3.png",
        fallbackUrls: ["/img/result-poster-1.png", "/img/result-poster.png", "/img/RESULT POSTER.png"],
        titleColor: "#064e3b", // Deep emerald
        sectionColor: "#059669", // Vibrant emerald
        pos1Color: "#059669", // Emerald
        pos2Color: "#9f1239", // Wine/Rose
        pos3Color: "#0f766e", // Teal
      };
    default:
      return {
        templateUrl: "/img/result-poster-1.png",
        fallbackUrls: ["/img/result-poster.png", "/img/RESULT POSTER.png"],
        titleColor: "#1e1b4b",
        sectionColor: "#b91c1c",
        pos1Color: "#b91c1c",
        pos2Color: "#0260a8",
        pos3Color: "#b45309",
      };
  }
}

async function loadPosterTemplate(style: PosterStyle): Promise<HTMLImageElement | null> {
  const theme = getStyleTheme(style);
  const candidateUrls = [theme.templateUrl, ...theme.fallbackUrls];
  for (const url of candidateUrls) {
    try {
      const img = await loadImage(url);
      if (img && img.width > 0) return img;
    } catch {
      // try next candidate URL
    }
  }
  return null;
}

/**
 * Generate a high-quality poster canvas image for the result
 * @param data Poster data
 * @param style Poster style variant (1, 2, or 3)
 * @returns Promise that resolves to Data URL of the generated PNG image
 */
export async function generateResultPoster(data: PosterData, style: PosterStyle = 1): Promise<string> {
  const theme = getStyleTheme(style);
  const templateImage = await loadPosterTemplate(style);

  // 1. If template image loaded, render using the official poster template
  if (templateImage) {
    const baseWidth = templateImage.width;
    const baseHeight = templateImage.height;
    const scale = 2; // 2x resolution for ultra-sharp typography and download quality

    const canvas = document.createElement("canvas");
    canvas.width = baseWidth * scale;
    canvas.height = baseHeight * scale;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Draw background poster template
    ctx.drawImage(templateImage, 0, 0, baseWidth, baseHeight);

    // 1. Section Name (upper left, above program title)
    const sectionText = (data.section || "General").toUpperCase();
    ctx.fillStyle = theme.sectionColor;
    ctx.font = 'bold 15px "Noto Sans Malayalam", "Arial", sans-serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(sectionText, 66, 165);

    // 2. Program Title (upper left)
    const maxTitleWidth = 475;
    ctx.fillStyle = theme.titleColor;
    ctx.font = 'bold 30px "Noto Sans Malayalam", "Arial", sans-serif';

    if (ctx.measureText(data.programName).width <= maxTitleWidth) {
      ctx.fillText(data.programName, 66, 208);
    } else {
      // Split into two lines or scale font
      const words = data.programName.split(" ");
      let line1 = "";
      let line2 = "";
      for (const word of words) {
        const testLine = line1 ? `${line1} ${word}` : word;
        if (ctx.measureText(testLine).width <= maxTitleWidth && !line2) {
          line1 = testLine;
        } else {
          line2 = line2 ? `${line2} ${word}` : word;
        }
      }

      if (line2) {
        while (line2.length > 0 && ctx.measureText(line2 + "...").width > maxTitleWidth) {
          line2 = line2.slice(0, -1);
        }
        if (line2.length < data.programName.length) line2 += "...";
        ctx.font = 'bold 26px "Noto Sans Malayalam", "Arial", sans-serif';
        ctx.fillText(line1, 66, 196);
        ctx.fillText(line2, 66, 226);
      } else {
        let display = data.programName;
        while (display.length > 0 && ctx.measureText(display + "...").width > maxTitleWidth) {
          display = display.slice(0, -1);
        }
        ctx.fillText(display + "...", 66, 208);
      }
    }

    // 3. Prizes for Position 1, 2, 3 (next to pre-printed numbered circles)
    const positionsConfig = [
      { pos: 1, centerY: 324, accentColor: theme.pos1Color },
      { pos: 2, centerY: 416, accentColor: theme.pos2Color },
      { pos: 3, centerY: 508, accentColor: theme.pos3Color },
    ];

    const textStartX = 145;
    const maxContentWidth = 415;

    positionsConfig.forEach(({ pos, centerY, accentColor }) => {
      const entries = data.prizes.filter((p) => p.position === pos);
      if (!entries || entries.length === 0) return;

      if (entries.length === 1) {
        const entry = entries[0];
        const name = entry.studentName || entry.teamName || "—";
        const team = entry.studentName && entry.teamName ? entry.teamName : "";
        const chest = entry.chestNumber ? `#${entry.chestNumber}` : "";

        let subtitle = "";
        if (team && chest) {
          subtitle = `${team.toUpperCase()} • ${chest}`;
        } else if (team) {
          subtitle = team.toUpperCase();
        } else if (chest) {
          subtitle = `CHEST: ${chest}`;
        }

        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        if (subtitle) {
          // Winner Name
          ctx.fillStyle = "#0f172a";
          ctx.font = 'bold 25px "Noto Sans Malayalam", "Arial", sans-serif';
          let displayName = name;
          while (displayName.length > 0 && ctx.measureText(displayName + "...").width > maxContentWidth) {
            displayName = displayName.slice(0, -1);
          }
          if (displayName !== name) displayName += "...";
          ctx.fillText(displayName, textStartX, centerY - 11);

          // Subtitle (Team / Chest)
          ctx.fillStyle = accentColor;
          ctx.font = 'bold 15px "Noto Sans Malayalam", "Arial", sans-serif';
          let displaySub = subtitle;
          while (displaySub.length > 0 && ctx.measureText(displaySub + "...").width > maxContentWidth) {
            displaySub = displaySub.slice(0, -1);
          }
          if (displaySub !== subtitle) displaySub += "...";
          ctx.fillText(displaySub, textStartX, centerY + 13);
        } else {
          // Only Name
          ctx.fillStyle = "#0f172a";
          ctx.font = 'bold 26px "Noto Sans Malayalam", "Arial", sans-serif';
          let displayName = name;
          while (displayName.length > 0 && ctx.measureText(displayName + "...").width > maxContentWidth) {
            displayName = displayName.slice(0, -1);
          }
          if (displayName !== name) displayName += "...";
          ctx.fillText(displayName, textStartX, centerY);
        }
      } else {
        // Multiple entries (tie for position)
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        entries.slice(0, 2).forEach((entry, idx) => {
          const yOffset = idx === 0 ? -14 : 14;
          const name = entry.studentName || entry.teamName || "—";
          const team = entry.studentName && entry.teamName ? ` (${entry.teamName.toUpperCase()})` : "";
          ctx.fillStyle = "#0f172a";
          ctx.font = 'bold 18px "Noto Sans Malayalam", "Arial", sans-serif';
          let text = `${name}${team}`;
          while (text.length > 0 && ctx.measureText(text + "...").width > maxContentWidth) {
            text = text.slice(0, -1);
          }
          if (text !== `${name}${team}`) text += "...";
          ctx.fillText(text, textStartX, centerY + yOffset);
        });
      }
    });

    return canvas.toDataURL("image/png", 1.0);
  }

  // 2. Fallback gradient poster if template image is not found
  const gradientColors = getGradientColors(style);
  const imageWidth = 1080;
  const imageHeight = 1350;

  const canvas = document.createElement("canvas");
  canvas.width = imageWidth;
  canvas.height = imageHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const gradient = ctx.createLinearGradient(0, 0, imageWidth, imageHeight);
  gradientColors.stops.forEach((stop) => {
    gradient.addColorStop(stop.offset, stop.color);
  });
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, imageWidth, imageHeight);

  const scaleX = imageWidth / 1080;
  const scaleY = imageHeight / 1350;

  // Title Section - Program Name
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const titleY = 120 * scaleY;
  const fontSize = 64 * scaleY;
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${fontSize}px 'Arial', sans-serif`;

  let displayProgramName = data.programName;
  const maxTitleWidth = 940 * scaleX;
  let metrics = ctx.measureText(displayProgramName);
  if (metrics.width > maxTitleWidth) {
    while (ctx.measureText(displayProgramName + "...").width > maxTitleWidth && displayProgramName.length > 0) {
      displayProgramName = displayProgramName.slice(0, -1);
    }
    displayProgramName = displayProgramName + "...";
  }
  ctx.fillText(displayProgramName, imageWidth / 2, titleY);

  // Section
  const sectionY = 180 * scaleY;
  ctx.fillStyle = "#fbbf24";
  const sectionFontSize = 48 * scaleY;
  ctx.font = `${sectionFontSize}px 'Arial', sans-serif`;

  let displaySection = data.section || "General";
  const maxSectionWidth = 940 * scaleX;
  metrics = ctx.measureText(displaySection);
  if (metrics.width > maxSectionWidth) {
    while (ctx.measureText(displaySection + "...").width > maxSectionWidth && displaySection.length > 0) {
      displaySection = displaySection.slice(0, -1);
    }
    displaySection = displaySection + "...";
  }
  ctx.fillText(displaySection, imageWidth / 2, sectionY);

  // Prize Sections
  let currentY = 350 * scaleY;
  const prizeSpacing = 200 * scaleY;
  const sectionWidth = 800 * scaleX;
  const sectionX = (imageWidth - sectionWidth) / 2;

  const sortedPrizes = [...data.prizes].sort((a, b) => a.position - b.position);

  sortedPrizes.forEach((prize, index) => {
    const positionY = currentY + index * prizeSpacing;
    const positionConfig: Record<number, { emoji: string }> = {
      1: { emoji: "🥇" },
      2: { emoji: "🥈" },
      3: { emoji: "🥉" },
    };
    const config = positionConfig[prize.position] || { emoji: "🏅" };

    const name = prize.studentName || prize.teamName || "—";
    ctx.fillStyle = "#ffffff";
    const nameFontSize = 48 * scaleY;
    ctx.font = `bold ${nameFontSize}px 'Arial', sans-serif`;
    ctx.textAlign = "left";

    const iconSize = 50 * scaleX;
    const iconSpacing = 15 * scaleX;
    const nameStartX = sectionX + 40 * scaleX;
    const nameY = positionY + 50 * scaleY;
    const teamNameY = nameY + 50 * scaleY;

    const maxNameWidth = sectionWidth - 80 * scaleX - iconSize - iconSpacing;
    let displayName = name;
    const nameMetrics = ctx.measureText(displayName);
    if (nameMetrics.width > maxNameWidth) {
      while (ctx.measureText(displayName + "...").width > maxNameWidth && displayName.length > 0) {
        displayName = displayName.slice(0, -1);
      }
      displayName = displayName + "...";
    }

    const hasTeamName = (prize.studentName && prize.teamName) || (!prize.studentName && prize.teamName);
    const iconY = hasTeamName ? (nameY + teamNameY) / 2 : nameY;

    const iconFontSize = 50 * scaleY;
    ctx.font = `${iconFontSize}px 'Arial', sans-serif`;
    ctx.fillText(config.emoji, nameStartX, iconY);

    ctx.font = `bold ${nameFontSize}px 'Arial', sans-serif`;
    ctx.fillText(displayName, nameStartX + iconSize + iconSpacing, nameY);

    if (prize.studentName && prize.teamName) {
      ctx.fillStyle = "#ef4444";
      const teamFontSize = 32 * scaleY;
      ctx.font = `${teamFontSize}px 'Arial', sans-serif`;
      ctx.fillText(prize.teamName, nameStartX + iconSize + iconSpacing, teamNameY);
    } else if (!prize.studentName && prize.teamName) {
      ctx.fillStyle = "#ef4444";
      const teamFontSize = 32 * scaleY;
      ctx.font = `${teamFontSize}px 'Arial', sans-serif`;
      ctx.fillText(prize.teamName, nameStartX + iconSize + iconSpacing, teamNameY);
    }
  });

  const footerY = 1250 * scaleY;
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  const footerFontSize = 24 * scaleY;
  ctx.font = `${footerFontSize}px 'Arial', sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("Official Results", imageWidth / 2, footerY + 40 * scaleY);

  return canvas.toDataURL("image/png", 1.0);
}

