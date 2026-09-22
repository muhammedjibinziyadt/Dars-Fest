"use client";

interface PrizeEntry {
  position: 1 | 2 | 3;
  studentName?: string;
  teamName?: string;
  chestNumber?: string;
}

interface PosterData {
  programName: string;
  section?: string;
  category?: string;
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

/**
 * Generate a high-quality poster canvas image for the result
 * @param data Poster data
 * @param style Poster style variant (1, 2, or 3)
 * @returns Promise that resolves to Data URL of the generated PNG image
 */
export async function generateResultPoster(data: PosterData, style: PosterStyle = 1): Promise<string> {
  // 1. Load poster template background first to get its dimensions
  const gradientColors = getGradientColors(style);
  const templateUrl = `/poster-template-${style}.jpeg`;
  
  let templateImage: HTMLImageElement | null = null;
  let imageWidth = 1080; // Default fallback width
  let imageHeight = 1350; // Default fallback height
  
  try {
    templateImage = await loadImage(templateUrl);
    imageWidth = templateImage.width;
    imageHeight = templateImage.height;
  } catch (error) {
    console.warn("Failed to load poster template, using fallback dimensions:", error);
  }

  // Create canvas with exact image dimensions
  const canvas = document.createElement("canvas");
  canvas.width = imageWidth;
  canvas.height = imageHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Set high quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Draw poster template background
  if (templateImage) {
    // Draw the template image at its natural size
    ctx.drawImage(templateImage, 0, 0, imageWidth, imageHeight);
  } else {
    // Fallback to gradient background if image fails to load
    const gradient = ctx.createLinearGradient(0, 0, imageWidth, imageHeight);
    gradientColors.stops.forEach((stop) => {
      gradient.addColorStop(stop.offset, stop.color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, imageWidth, imageHeight);
  }

  // Calculate scale factors based on original 1080x1350 dimensions
  const scaleX = imageWidth / 1080;
  const scaleY = imageHeight / 1350;

  // 3. Title Section - Program Name
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  // Program Name - scaled font size
  const titleY = 120 * scaleY;
  const fontSize = 64 * scaleY;
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${fontSize}px 'Arial', sans-serif`;
  // Truncate long program names if needed
  let displayProgramName = data.programName;
  const maxTitleWidth = 940 * scaleX;
  let metrics = ctx.measureText(displayProgramName);
  if (metrics.width > maxTitleWidth) {
    // Truncate with ellipsis if too long
    while (ctx.measureText(displayProgramName + "...").width > maxTitleWidth && displayProgramName.length > 0) {
      displayProgramName = displayProgramName.slice(0, -1);
    }
    displayProgramName = displayProgramName + "...";
  }
  ctx.fillText(displayProgramName, imageWidth / 2, titleY);

  // 4. Section - smaller than program name, normal style
  const sectionY = 180 * scaleY; // Decreased gap from ProgramName
  ctx.fillStyle = "#fbbf24"; // Yellow color for all sections
  const sectionFontSize = 48 * scaleY;
  ctx.font = `${sectionFontSize}px 'Arial', sans-serif`; // Normal style, smaller than program name
  // Truncate long section names if needed
  let displaySection = data.section || "General";
  const maxSectionWidth = 940 * scaleX;
  metrics = ctx.measureText(displaySection);
  if (metrics.width > maxSectionWidth) {
    // Truncate with ellipsis if too long
    while (ctx.measureText(displaySection + "...").width > maxSectionWidth && displaySection.length > 0) {
      displaySection = displaySection.slice(0, -1);
    }
    displaySection = displaySection + "...";
  }
  ctx.fillText(displaySection, imageWidth / 2, sectionY);

  // 5. Prize Sections
  let currentY = 350 * scaleY;
  const prizeSpacing = 200 * scaleY;
  const sectionWidth = 800 * scaleX;
  const sectionX = (imageWidth - sectionWidth) / 2;

  // Sort prizes by position
  const sortedPrizes = [...data.prizes].sort((a, b) => a.position - b.position);

  sortedPrizes.forEach((prize, index) => {
    const positionY = currentY + index * prizeSpacing;

    // Position emoji icons
    const positionConfig = {
      1: { emoji: "🥇" }, // Gold
      2: { emoji: "🥈" }, // Silver
      3: { emoji: "🥉" }, // Bronze
    };

    const config = positionConfig[prize.position as keyof typeof positionConfig];

    // Student/Team Name with emoji icon on the left
    const name = prize.studentName || prize.teamName || "—";
    ctx.fillStyle = "#ffffff";
    const nameFontSize = 48 * scaleY;
    ctx.font = `bold ${nameFontSize}px 'Arial', sans-serif`;
    ctx.textAlign = "left";
    
    // Calculate icon size and spacing (scaled)
    const iconSize = 50 * scaleX; // Approximate size for emoji
    const iconSpacing = 15 * scaleX; // Space between icon and name
    const nameStartX = sectionX + 40 * scaleX;
    const nameY = positionY + 50 * scaleY;
    const teamNameY = nameY + 50 * scaleY; // Team name Y position
    
    // Truncate long names to fit (accounting for icon width)
    const maxNameWidth = sectionWidth - 80 * scaleX - iconSize - iconSpacing;
    let displayName = name;
    const metrics = ctx.measureText(displayName);
    if (metrics.width > maxNameWidth) {
      // Truncate with ellipsis
      while (ctx.measureText(displayName + "...").width > maxNameWidth && displayName.length > 0) {
        displayName = displayName.slice(0, -1);
      }
      displayName = displayName + "...";
    }
    
    // Calculate icon Y position to be centered between student name and team name
    // If there's a team name, center between both lines; otherwise align with student name
    const hasTeamName = (prize.studentName && prize.teamName) || (!prize.studentName && prize.teamName);
    const iconY = hasTeamName ? (nameY + teamNameY) / 2 : nameY;
    
    // Draw emoji icon (centered vertically between student and team name)
    const iconFontSize = 50 * scaleY;
    ctx.font = `${iconFontSize}px 'Arial', sans-serif`;
    ctx.fillText(config.emoji, nameStartX, iconY);
    
    // Draw student/team name next to icon
    ctx.font = `bold ${nameFontSize}px 'Arial', sans-serif`;
    ctx.fillText(displayName, nameStartX + iconSize + iconSpacing, nameY);

    // Team Name (if student) - smaller font, aligned with icon on left
    if (prize.studentName && prize.teamName) {
      ctx.fillStyle = "#ef4444"; // Red color
      const teamFontSize = 32 * scaleY;
      ctx.font = `${teamFontSize}px 'Arial', sans-serif`;
      ctx.fillText(prize.teamName, nameStartX + iconSize + iconSpacing, teamNameY);
    } else if (!prize.studentName && prize.teamName) {
      // Show team name even when no student (group/general sections)
      ctx.fillStyle = "#ef4444"; // Red color
      const teamFontSize = 32 * scaleY;
      ctx.font = `${teamFontSize}px 'Arial', sans-serif`;
      ctx.fillText(prize.teamName, nameStartX + iconSize + iconSpacing, teamNameY);
    }
  });

  // 6. Footer decoration
  const footerY = 1250 * scaleY;
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  const footerFontSize = 24 * scaleY;
  ctx.font = `${footerFontSize}px 'Arial', sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("Official Results", imageWidth / 2, footerY + 40 * scaleY);

  // 7. Add shadow effect around the poster
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 10;

  // Convert to data URL
  return canvas.toDataURL("image/png", 1.0);
}

