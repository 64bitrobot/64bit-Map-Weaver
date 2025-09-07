
import { TERRAINS } from '../constants';
import type { MapStyle } from '../types';

export const generatePromptWithLegend = (style: MapStyle): string => {
    let baseLayerInstruction = '';
    switch (style) {
        case 'pixel':
            baseLayerInstruction = 'a seamless, 16-bit pixel art texture of dirt ground';
            break;
        case 'sketch':
            baseLayerInstruction = 'a seamless, hand-drawn sketch texture of ground on parchment paper';
            break;
        case 'photorealistic':
        default:
            baseLayerInstruction = 'a seamless, photorealistic texture of packed earth or sparse dirt';
            break;
    }

    const basePrompt = `**AI Directive: Fantasy Map Generation from Blueprint**

You are a master fantasy cartographer AI. Your task is to create a high-quality, top-down Dungeons & Dragons battle map from a single color-coded blueprint image.

**Generation Process:**

1.  **Create the Base Layer:** Your first and most crucial step is to generate a full-canvas base layer. This layer should be **${baseLayerInstruction}**. This texture will serve as the foundation for the entire map and should be visible in any areas not covered by another terrain type from the blueprint.

2.  **Apply the Blueprint:** Once the base layer is established, you must "paint" the terrains specified in the blueprint on top of it, ensuring they match the overall art style.

3.  **Blend, Don't Replace:** Do not simply copy-paste the blueprint colors. You must render textures corresponding to each color and blend them seamlessly both with the underlying Base Layer and with each other at their borders. The Base Layer should remain visible in areas not covered by the blueprint, creating a natural ground floor for the entire map.

**Terrain Layering & Interaction Rules (Follow these steps conceptually):**

**Step 1: The Foundation - Base Terrains**
First, render the foundational landscape on top of the base layer. This includes the areas marked for **grass**, **forest**, and **mountains**.
- **Blending is Key:** Do not create hard, artificial lines between these terrains. Instead, create natural, blended transitions. For example:
    - The edge of a forest should thin out, with sparse trees giving way to the grassy plains.
    - Mountains should have foothills that gradually merge with the surrounding terrain.

**Step 2: Carving with Water**
Next, introduce the **water** features.
- Treat water as a force that shapes the land. Where the blueprint indicates water, you will "carve" it into the foundational layer.
- Create realistic shorelines where water meets land (e.g., sandy banks next to grass, rocky edges next to mountains).

**Step 3: Placing Structures**
Now, add the **ruined_walls**.
- These structures should be placed *on top of* the existing terrain. They are not part of the base land.
- Integrate them into their environment. Ruins in a forest might be covered in moss and vines. Ruins on a grassy plain might have grass growing between the stones.

**Step 4: Handling Roads (If Present)**
This is the final layer. **First, check the blueprint for the \`Road Yellow\` color.** If no roads are present in the blueprint, you can skip this step entirely. If roads ARE present, they must intelligently adapt to the terrain they cross.
- **On Grass or in Forest:** Render a clear dirt or cobblestone path. The path should look worn into the landscape, not painted on top. Blend the edges softly with the surrounding grass or undergrowth.
- **Crossing Water:** How you render a road at a body of water depends on the context. If a road blueprint shape clearly passes *over* a water body to connect land on both sides, render a logical **bridge** (e.g., wood, stone) that spans the gap. However, if a road simply leads *to* the water's edge and stops, it should terminate naturally as a dirt path that fades into the shoreline, or perhaps end at a small wooden **dock** or a **ford**. DO NOT build a bridge that leads nowhere.
- **Through Mountains:** When a road encounters mountains, it MUST NOT be a flat texture on a cliff. You must render it as a **tunnel entrance** leading into the mountain, or as a narrow, winding path cut into the rock face.

**Blueprint Color Mapping:**
The following list maps the colors in the blueprint to the terrain types you must render. Use this as your guide for placement.
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
        '#00FF00': 'Lime Green',
        '#FF00FF': 'Magenta',
        '#00FFFF': 'Cyan',
        '#FFFF00': 'Yellow',
        '#FFA500': 'Orange',
        '#FF0000': 'Red',
        '#111827': 'Black', // This is the background color, remains unchanged.
    };

    const legend = TERRAINS.map(terrain => {
        const colorName = colorNames[terrain.hexColor] ? ` (${colorNames[terrain.hexColor]})` : '';
        const description = textureDescriptions[terrain.id] || `A texture of ${terrain.name}.`;
        return `*   **COLOR:** \`${terrain.hexColor}\`${colorName} -> **TERRAIN:** ${description}`;
    }).join('\n');

    let styleInstructions = '';
    switch (style) {
        case 'pixel':
            styleInstructions = `**Final Output Style:** The final image must be in a **16-bit pixel art style**, suitable for a retro RPG. Use a limited, vibrant color palette. Features like trees, rocks, and water should be represented with clear, blocky sprites.`;
            break;
        case 'sketch':
            styleInstructions = `**Final Output Style:** The final image must be a **hand-drawn sketch**, as if made with pencil and ink on aged parchment paper. Use techniques like cross-hatching and stippling for shading and texture. Lines should be imperfect and have a hand-drawn quality. The overall feel should be that of a map from an old fantasy novel or module book.`;
            break;
        case 'photorealistic':
        default:
            styleInstructions = `**Final Output Style:** The final image must be **photorealistic**, top-down perspective, and suitable for use as a D&D battle map. The lighting should be neutral and even.`;
            break;
    }

    return `${basePrompt}\n${legend}\n\n${styleInstructions}`;
};
