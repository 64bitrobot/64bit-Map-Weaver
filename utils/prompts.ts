import { TERRAINS } from '../constants';
import type { MapStyle } from '../types';

export const generatePromptWithLegend = (style: MapStyle): string => {
    let stylePreamble = '';
    let baseLayerInstruction = '';
    let finalStyleInstruction = '';

    switch (style) {
        case 'pixel':
            stylePreamble = 'You are an expert pixel artist AI specializing in 16-bit retro RPG maps.';
            baseLayerInstruction = 'a seamless, 16-bit pixel art texture of dirt ground';
            finalStyleInstruction = `**Final Output Style:** The final image MUST be in a **16-bit pixel art style**, suitable for a retro RPG. Use a limited, vibrant color palette. Features like trees, rocks, and water should be represented with clear, blocky sprites. Absolutely no photorealistic elements, anti-aliasing, or smooth gradients should be present.`;
            break;
        case 'photorealistic':
        default:
            stylePreamble = 'You are a master fantasy cartographer AI.';
            baseLayerInstruction = 'a seamless, photorealistic texture of packed earth or sparse dirt';
            finalStyleInstruction = `**Final Output Style:** The final image must be **photorealistic**, top-down perspective, and suitable for use as a D&D battle map. The lighting should be neutral and even.`;
            break;
    }

    const basePrompt = `**AI Directive: Fantasy Map Generation from Blueprint**

${stylePreamble} Your mission is to meticulously follow a step-by-step process to convert a color-coded blueprint into a high-quality, top-down Dungeons & Dragons battle map. While the steps provide structure, the final image must look like a single, organic environment.

**Core Rule: Natural Blending is MANDATORY**
- At every step, you MUST avoid creating hard, artificial lines between different terrains.
- Edges where terrains meet (e.g., forest and grass) MUST have a soft, natural transition (an "ecotone"). A forest's edge should thin out into the grassland. A mountain's base should have scree and foothills that merge with the lowlands.

**Step-by-Step Rendering Process:**

1.  **Step 1: The Foundation**
    - Create a full-canvas base layer of **${baseLayerInstruction}**. This is the ground that exists under everything else.

2.  **Step 2: Render Primary Terrains**
    - On top of the foundation, render the main environmental features according to the blueprint colors: **Grass, Forest, Water, and Mountains**.
    - As you render each area, ensure its borders blend realistically with any adjacent terrain from this step. For example, shorelines must be realistic, with sandy or pebbly banks where water meets grass.

3.  **Step 3: Integrate Structures & Paths**
    - Render the **Ruins** and **Roads** on top of the previously rendered terrain. These elements must look integrated, not just placed on top.
    - **Ruins:** Must be weathered and overgrown. Ruins in a forest should have moss; ruins in a field should have grass growing through cracks.
    - **Roads:** Must adapt to the terrain they cross. A road over grass is a dirt path. A road over water requires a logical **bridge**. A road into a mountain should be a **tunnel entrance** or a path cut into the rock face.

**Blueprint Color Mapping:**
This list maps the blueprint colors to the specific terrain you must render in the steps above.
`;

    const textureDescriptions: Record<string, string> = {
        'grass': 'A temperate, green grassy field.',
        'forest': 'A dense, temperate forest with visible trees and undergrowth.',
        'water': 'A clear lake or river.',
        'road': 'A dirt or cobblestone road.',
        'ruined_walls': 'Crumbling, ancient stone ruins of walls or buildings.',
        'mountains': 'Rocky, impassable mountain terrain or cliffs.',
    };

    const colorNames: Record<string, string> = {
        '#76B947': 'Bright Green',
        '#223C3C': 'Very Dark Slate Gray',
        '#4AB4A9': 'Teal Green',
        '#D2B48C': 'Tan',
        '#8A89A6': 'Lavender Gray',
        '#60544D': 'Dark Taupe',
        '#111827': 'Black', // This is the background color, remains unchanged.
    };

    const legend = TERRAINS.map(terrain => {
        const colorName = colorNames[terrain.hexColor] ? ` (${colorNames[terrain.hexColor]})` : '';
        const description = textureDescriptions[terrain.id] || `A texture of ${terrain.name}.`;
        return `*   **COLOR:** \`${terrain.hexColor}\`${colorName} -> **TERRAIN:** ${description}`;
    }).join('\n');

    return `${basePrompt}\n${legend}\n\n${finalStyleInstruction}`;
};