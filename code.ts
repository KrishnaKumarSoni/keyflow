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
figma.ui.onmessage = async (msg) => {
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
