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
  colors?: Array<{ name: string; value: string }>;
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
      if (msg.formData.colors?.[0]?.value) {
        const rgb = hexToRgb(msg.formData.colors[0].value);
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

      figma.notify("Flow pages created successfully!");
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