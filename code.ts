// Add at the top of the file
type PlatformType = 'mobile' | 'website' | 'webapp';

const PLATFORM_SIZES: Record<PlatformType, { width: number; height: number }> = {
  mobile: { width: 375, height: 812 },
  website: { width: 1440, height: 1024 },
  webapp: { width: 1920, height: 1080 }
};

// Add interface for form data
interface FormData {
  platform: PlatformType;
  fontFamily?: string;
  colors?: Array<{ color: string; name: string }>;
  iteration: number;
  screens: string;
  title?: string;
  layout?: string;
  columns: number;
}

// Update message type
interface PluginMessage {
  type: 'create-flow';
  formData: FormData;
}

// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { 
  width: 400,
  height: 680,
  themeColors: true
});

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = async (msg: PluginMessage) => {
  if (msg.type === 'create-flow') {
    try {
      // Create all pages first
      const pages = [
        "🎨 Cover Page",
        "🚀 Final Delivery", 
        "✨ High Fidelity",
        "🎯 Low Fidelity",
        "🎪 Mood Boarding & Exploration",
        "🧩 Components",
        "🔨 Rough Work"
      ];

      // Create pages synchronously to avoid memory issues
      const newPages = [];
      for (const pageName of pages) {
        const page = figma.createPage();
        page.name = pageName;
        page.backgrounds = [{
          type: 'SOLID',
          color: { r: 35/255, g: 35/255, b: 35/255 }
        }];
        newPages.push(page);
      }

      // Set first page as current
      const coverPage = newPages[0];
      await figma.setCurrentPageAsync(coverPage);

      // Create cover frame
      const coverFrame = figma.createFrame();
      coverFrame.name = "Cover";
      coverFrame.resize(1920, 1080);
      coverPage.appendChild(coverFrame);

      // Handle background color
      if (msg.formData.colors?.[0]?.color) {
        const rgb = hexToRgb(msg.formData.colors[0].color);
        coverFrame.fills = [{
          type: 'SOLID',
          color: { r: rgb.r/255, g: rgb.g/255, b: rgb.b/255 }
        }];
      }

      // Handle title text
      if (msg.formData.title) {
        const fontFamily = msg.formData.fontFamily || "Inter";
        await figma.loadFontAsync({ family: fontFamily, style: "Regular" });
        
        const titleText = figma.createText();
        coverFrame.appendChild(titleText);
        
        titleText.fontName = { family: fontFamily, style: "Regular" };
        titleText.characters = msg.formData.title;
        titleText.fontSize = 200;
        titleText.textAlignHorizontal = "CENTER";
        titleText.textAlignVertical = "CENTER";
        
        // Position text after all properties are set
        titleText.x = (coverFrame.width - titleText.width) / 2;
        titleText.y = (coverFrame.height - titleText.height) / 2;
      }

      // Set thumbnail
      await figma.setFileThumbnailNodeAsync(coverFrame);

      // Get platform size
      const platformSize = PLATFORM_SIZES[msg.formData.platform as PlatformType];
      const screens = parseInt(msg.formData.screens) || 1;
      const iterations = msg.formData.iteration || 1;

      // Create frames in High Fidelity page
      const hifiPage = newPages[2];
      await figma.setCurrentPageAsync(hifiPage);
      const columns = msg.formData.columns || 12;
      createFrameGrid(hifiPage, {
        rows: iterations,
        cols: screens,
        frameSize: platformSize,
        prefix: 'Screen',
        columns: columns
      });

      // Create frames in Low Fidelity page
      const lofiPage = newPages[3];
      await figma.setCurrentPageAsync(lofiPage);
      createFrameGrid(lofiPage, {
        rows: iterations,
        cols: screens,
        frameSize: platformSize,
        prefix: 'Screen',
        columns: columns
      });

      // Create frames in Final Delivery page
      const finalPage = newPages[1];
      await figma.setCurrentPageAsync(finalPage);
      createFrameGrid(finalPage, {
        rows: 1,
        cols: screens,
        frameSize: platformSize,
        prefix: 'Screen'
      });

      // Create large frames for utility pages
      const moodboardPage = newPages[4];
      const componentsPage = newPages[5];
      const roughWorkPage = newPages[6];

      await figma.setCurrentPageAsync(moodboardPage);
      createLargeFrame(moodboardPage, "Moodboard Canvas");

      await figma.setCurrentPageAsync(componentsPage);
      createLargeFrame(componentsPage, "Components Library");

      await figma.setCurrentPageAsync(roughWorkPage);
      createLargeFrame(roughWorkPage, "Rough Work Area");

      // Set back to cover page
      await figma.setCurrentPageAsync(coverPage);

      // Font preset constants
      const FONT_PRESETS = {
        DISPLAY: {
          LARGE: { size: 57, style: "Bold", lineHeight: 1.2 },
          MEDIUM: { size: 45, style: "Bold", lineHeight: 1.2 },
          SMALL: { size: 36, style: "Bold", lineHeight: 1.2 }
        },
        HEADING: {
          H1: { size: 32, style: "Bold", lineHeight: 1.3 },
          H2: { size: 28, style: "SemiBold", lineHeight: 1.3 },
          H3: { size: 24, style: "SemiBold", lineHeight: 1.3 },
          H4: { size: 20, style: "SemiBold", lineHeight: 1.4 },
          H5: { size: 18, style: "Medium", lineHeight: 1.4 },
          H6: { size: 16, style: "Medium", lineHeight: 1.4 }
        },
        BODY: {
          LARGE: { size: 16, style: "Regular", lineHeight: 1.5 },
          MEDIUM: { size: 14, style: "Regular", lineHeight: 1.5 },
          SMALL: { size: 12, style: "Regular", lineHeight: 1.5 }
        },
        LABEL: {
          LARGE: { size: 14, style: "Medium", lineHeight: 1.4 },
          MEDIUM: { size: 12, style: "Medium", lineHeight: 1.4 },
          SMALL: { size: 11, style: "Medium", lineHeight: 1.4 }
        }
      };

      // Helper functions for style creation
      async function createTextStyle(name: string, fontFamily: string, config: { size: number, style: string, lineHeight: number }) {
        const fontName = { family: fontFamily, style: config.style };
        
        try {
          await figma.loadFontAsync(fontName);
        } catch {
          fontName.style = "Regular";
          await figma.loadFontAsync(fontName);
        }

        const style = figma.createTextStyle();
        style.name = name;
        style.fontName = fontName;
        style.fontSize = config.size;
        style.lineHeight = { value: config.size * config.lineHeight, unit: 'PIXELS' };
        
        return style;
      }

      function createColorStyle(name: string, color: RGB) {
        try {
          const style = figma.createPaintStyle();
          style.name = name;
          style.paints = [{
            type: 'SOLID',
            color: {
              r: Math.max(0, Math.min(1, color.r)),
              g: Math.max(0, Math.min(1, color.g)),
              b: Math.max(0, Math.min(1, color.b))
            }
          }];
          return style;
        } catch (error) {
          console.error(`Failed to create color style ${name}:`, error);
          return null;
        }
      }

      async function createDesignSystemStyles(formData: FormData) {
        if (formData.fontFamily) {
          const fontFamily = formData.fontFamily;
          
          for (const [category, sizes] of Object.entries(FONT_PRESETS)) {
            for (const [size, config] of Object.entries(sizes)) {
              try {
                const name = `${category}/${size}`;
                await createTextStyle(name, fontFamily, config);
              } catch (err) {
                console.error(`Failed to create text style ${category}/${size}:`, err);
              }
            }
          }
        }

        if (formData.colors?.length) {
          for (const [index, colorData] of formData.colors.entries()) {
            const rgb = hexToRgb(colorData.color);
            const style = figma.createPaintStyle();
            
            // Set folder path based on color type
            const folderPath = index === 0 ? "Primary" : 
                              index === 1 ? "Secondary" : 
                              "Colors";
            
            style.name = `${folderPath}/${colorData.name}`;
            style.paints = [{
              type: 'SOLID',
              color: { 
                r: rgb.r/255, 
                g: rgb.g/255, 
                b: rgb.b/255 
              }
            }];
          }
        }
      }

      // Create design system styles
      await createDesignSystemStyles(msg.formData);

      // Set back to cover page
      await figma.setCurrentPageAsync(coverPage);

      figma.notify("Flow pages and styles created successfully!");
    } catch (error) {
      console.error('Plugin error:', error);
      figma.notify(`Error: ${error}`, {error: true});
    }
  }
};

// Helper function to convert hex to RGB
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}


const SPACING = 500;

function createFrameGrid(page: PageNode, options: {
  rows: number,
  cols: number,
  frameSize: { width: number, height: number },
  prefix: string,
  columns?: number
}) {
  const { rows, cols, frameSize, prefix, columns } = options;
  const frames: FrameNode[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const frame = figma.createFrame();
      frame.resize(frameSize.width, frameSize.height);
      frame.x = col * (frameSize.width + SPACING) + SPACING;
      frame.y = row * (frameSize.height + SPACING) + SPACING;
      frame.name = `${prefix} ${col + 1}.${row + 1}`;
      frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
      
      // Add layout grid if columns is specified
      if (columns) {
        frame.layoutGrids = createLayoutGrid(columns);
      }
      
      page.appendChild(frame);
      frames.push(frame);
    }
  }
  
  return frames;
}

function createLargeFrame(page: PageNode, name: string) {
  const frame = figma.createFrame();
  frame.name = name;
  frame.resize(1920, 5400); // 5x height of desktop (1080px)
  frame.x = SPACING;
  frame.y = SPACING;
  frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  page.appendChild(frame);
  return frame;
}

function createLayoutGrid(columns: number): LayoutGrid[] {
  return [{
    pattern: "COLUMNS",
    alignment: "STRETCH",
    gutterSize: 12,
    count: columns,
    offset: 0,
    visible: true,
    color: { r: 0.1, g: 0.1, b: 0.1, a: 0.2 }
  } as LayoutGrid];
}