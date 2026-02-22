interface RectShape {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Attrs {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
  fontFamily: string;
  fontSize: number;
  textAlign: string;
  stroke: string;
  strokeWidth: number;
  draggable: boolean;
  name: string;
  align: string;
  scaleX: number;
  scaleY: number;
  imageUrls: string[];
  imageIndex: number;
  prompt: string;
}
interface Grid {
  cType: 'comic_text' | 'comic_page' | 'comic_image';
  attrs: Partial<Attrs>
  children?: Grid[]
  imageUrl?: string

}

const createGrid = (shapes: RectShape[]) => {
  const grids: Grid[] = shapes.map((shape) => ({
    "cType": "comic_page",
    "attrs": {
      "id": crypto.randomUUID(),
      "scaleX": 1,
      "scaleY": 1,
      "stroke": "black",
      "strokeWidth": 5,
      "fill": "white",
      "name": "rectangle",
      "draggable": true,
      ...shape
    },
    "children": [
      {
        "cType": "comic_image",
        "attrs": {
          "id": crypto.randomUUID(),
          "cType": "comic_image",
          "draggable": true,
          "x": 0,
          "y": 0,
          "width": shape.width,
          "height": shape.height,
          "imageUrls": [
            "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
          ],
          "imageIndex": 0,
          "prompt": "Lumine (Genshin Impact), ",
          "model": "Flux",
          "selectedCharImages": [],
          "referenceImage": null
        },
        "imageUrl": "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
      }
    ]
  }));

  grids.push({
    "cType": "comic_text",
    "attrs": {
      "id": "90c5cbb0-6b45-4bb7-9daa-8df78159f9bf",
      "x": 0,
      "y": 0,
      "text": "",
      "color": "black",
      "fontFamily": "Wildwords",
      "fontSize": 80,
      "textAlign": "left",
      "stroke": "white",
      "strokeWidth": 0,
      "draggable": true,
      "name": "text",
      "align": "left"
    }
  });

  return grids;
};

type LayoutOption = {
  width?: number;
  height?: number;
  padding?: number[];
  rows?: number;
  cols?: number;
  gap?: number;
  ratioDir?: 'column' | 'row';
  ratio?: number[][]
}

const createLayout = (options?: LayoutOption) => {
  const defaultOptions: Required<LayoutOption> = {
    width: 2030,
    height: 2130,
    padding: [100, 0, 0, 0], // top right bottom left
    rows: 2,
    cols: 2,
    gap: 30,
    ratioDir: 'column',
    ratio: [[1, 1], [1, 1]], // means 1:1 and [1,2] means 1:2
  };
  options = Object.assign({}, defaultOptions, options);

  const {
    cols,
    rows,
    ratio,
    ratioDir,
    width,
    height,
    gap,
    padding,
  } = options;
  const [top = 0, right = 0, bottom = 0, left = 0] = padding || [];
  const gridTotalWidth = width! - (cols! - 1) * gap! - left - right;
  const gridTotalHeight = height! - (rows! - 1) * gap! - top - bottom;
  const sum = (num: number[]) => num.reduce((s, n) => s + n);
  const cumulate = (num: number[], i: number) => num.slice(0, i).reduce((s, n) => s + n, 0)

  return Array(options.rows!)
    .fill(null)
    .map((_, r) => Array(options.cols!)
      .fill(null)
      .map((_, c) => {
        if (ratioDir === 'column') {
          const gridHeight = gridTotalHeight / rows!;
          const ratioCol = ratio![r];
          const total = sum(ratioCol);
          const blockWidth = gridTotalWidth / total;

          return {
            x: left + cumulate(ratioCol, c) * blockWidth + gap! * c,
            y: top + gridHeight * r + gap! * r,
            width: ratioCol[c] * blockWidth,
            height: gridHeight,
          }
        }
        const gridWidth = gridTotalWidth / cols!;
        const ratioRow = ratio![c];
        const total = sum(ratioRow);
        const blockHeight = gridTotalHeight / total;
        return {
          x: left + gridWidth * c + gap! * c,
          y: top + blockHeight * cumulate(ratioRow, r) + gap! * r,
          width: gridWidth,
          height: blockHeight * ratioRow[r],
        }
      })).flat();
}

export const grid0 = [
  {
    "cType": "comic_page",
    "attrs": {
      "id": "0c06dfbb-aa53-4fd3-a9c2-c00fa896d0c3",
      "height": 1000,
      "width": 1000,
      "x": 0,
      "y": 100,
      "scaleX": 1,
      "scaleY": 1,
      "stroke": "black",
      "strokeWidth": 5,
      "fill": "white",
      "name": "rectangle",
      "draggable": true
    },
    "children": [
      {
        "cType": "comic_image",
        "attrs": {
          "id": "0a0c3252-965a-4578-a505-f3e5aee5800d",
          "cType": "comic_image",
          "draggable": true,
          "x": 0,
          "y": 0,
          "width": 1000,
          "height": 1000,
          "imageUrls": [
            "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
          ],
          "imageIndex": 0,
          "prompt": "Lumine (Genshin Impact), ",
          "model": "Flux",
          "selectedCharImages": [],
          "referenceImage": null
        },
        "imageUrl": "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
      }
    ]
  },
  {
    "cType": "comic_page",
    "attrs": {
      "id": "e363bc70-17f9-4e6b-a6c4-4c8ff9bc54a8",
      "height": 1000,
      "width": 1000,
      "x": 1030,
      "y": 100,
      "scaleX": 1,
      "scaleY": 1,
      "stroke": "black",
      "strokeWidth": 5,
      "fill": "white",
      "name": "rectangle",
      "draggable": true
    },
    "children": [
      {
        "cType": "comic_image",
        "attrs": {
          "id": "c44fff5e-2825-4723-ab79-55fe0f02b00d",
          "cType": "comic_image",
          "draggable": true,
          "x": 0,
          "y": 0,
          "width": 1000,
          "height": 1000,
          "imageUrls": [
            "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
          ],
          "imageIndex": 0,
          "prompt": "Lumine (Genshin Impact), ",
          "model": "Flux",
          "selectedCharImages": [],
          "referenceImage": null
        },
        "imageUrl": "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
      }
    ],
    "childSorting": [
      "c44fff5e-2825-4723-ab79-55fe0f02b00d"
    ]
  },
  {
    "cType": "comic_page",
    "attrs": {
      "id": "fcbb26d8-d5d9-4c1d-b830-ba280f9a60be",
      "height": 1000,
      "width": 1000,
      "x": 0,
      "y": 1130,
      "scaleX": 1,
      "scaleY": 1,
      "stroke": "black",
      "strokeWidth": 5,
      "fill": "white",
      "name": "rectangle",
      "draggable": true
    },
    "children": [
      {
        "cType": "comic_image",
        "attrs": {
          "id": "32f0c151-596f-4a76-929d-e6aff9705cca",
          "cType": "comic_image",
          "draggable": true,
          "x": 0,
          "y": 0,
          "width": 1000,
          "height": 1000,
          "imageUrls": [
            "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
          ],
          "imageIndex": 0,
          "prompt": "Lumine (Genshin Impact), ",
          "model": "Flux",
          "selectedCharImages": [],
          "referenceImage": null
        },
        "imageUrl": "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
      }
    ],
    "childSorting": [
      "32f0c151-596f-4a76-929d-e6aff9705cca"
    ]
  },
  {
    "cType": "comic_page",
    "attrs": {
      "id": "481ce77c-afab-47f1-8ab1-9a314b334429",
      "height": 1000,
      "width": 1000,
      "x": 1030,
      "y": 1130,
      "scaleX": 1,
      "scaleY": 1,
      "stroke": "black",
      "strokeWidth": 5,
      "fill": "white",
      "name": "rectangle",
      "draggable": true
    },
    "children": [
      {
        "cType": "comic_image",
        "attrs": {
          "id": "d5bc8744-6063-4fb7-b1bd-7c32a03d6fe4",
          "cType": "comic_image",
          "draggable": true,
          "x": 0,
          "y": 0,
          "width": 1000,
          "height": 1000,
          "imageUrls": [
            "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
          ],
          "imageIndex": 0,
          "prompt": "Lumine (Genshin Impact), ",
          "model": "Flux",
          "selectedCharImages": [],
          "referenceImage": null
        },
        "imageUrl": "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
      }
    ],
    "childSorting": [
      "d5bc8744-6063-4fb7-b1bd-7c32a03d6fe4"
    ]
  },
  {
    "cType": "comic_text",
    "attrs": {
      "id": "90c5cbb0-6b45-4bb7-9daa-8df78159f9bf",
      "x": 0,
      "y": 0,
      "text": "",
      "color": "black",
      "fontFamily": "Wildwords",
      "fontSize": 80,
      "textAlign": "left",
      "stroke": "white",
      "strokeWidth": 0,
      "draggable": true,
      "name": "text",
      "align": "left"
    }
  }

];

export const grid1 = [
  {
    "cType": "comic_page",
    "attrs": {
      "id": "0c06dfbb-aa53-4fd3-a9c2-c00fa896d0c3",
      "height": 700,
      "width": 1000,
      "x": 0,
      "y": 100,
      "scaleX": 1,
      "scaleY": 1,
      "stroke": "black",
      "strokeWidth": 5,
      "fill": "white",
      "name": "rectangle",
      "draggable": true
    },
    "children": [
      {
        "cType": "comic_image",
        "attrs": {
          "id": "0a0c3252-965a-4578-a505-f3e5aee5800d",
          "cType": "comic_image",
          "draggable": true,
          "x": 0,
          "y": 0,
          "width": 1000,
          "height": 700,
          "imageUrls": [
            "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
          ],
          "imageIndex": 0,
          "prompt": "Lumine (Genshin Impact), ",
          "model": "Flux",
          "selectedCharImages": [],
          "referenceImage": null
        },
        "imageUrl": "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
      }
    ]
  },
  {
    "cType": "comic_page",
    "attrs": {
      "id": "e363bc70-17f9-4e6b-a6c4-4c8ff9bc54a8",
      "height": 1300,
      "width": 1000,
      "x": 1030,
      "y": 100,
      "scaleX": 1,
      "scaleY": 1,
      "stroke": "black",
      "strokeWidth": 5,
      "fill": "white",
      "name": "rectangle",
      "draggable": true
    },
    "children": [
      {
        "cType": "comic_image",
        "attrs": {
          "id": "c44fff5e-2825-4723-ab79-55fe0f02b00d",
          "cType": "comic_image",
          "draggable": true,
          "x": 0,
          "y": 0,
          "width": 1000,
          "height": 1300,
          "imageUrls": [
            "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
          ],
          "imageIndex": 0,
          "prompt": "Lumine (Genshin Impact), ",
          "model": "Flux",
          "selectedCharImages": [],
          "referenceImage": null
        },
        "imageUrl": "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
      }
    ],
    "childSorting": [
      "c44fff5e-2825-4723-ab79-55fe0f02b00d"
    ]
  },
  {
    "cType": "comic_page",
    "attrs": {
      "id": "fcbb26d8-d5d9-4c1d-b830-ba280f9a60be",
      "height": 1300,
      "width": 1000,
      "x": 0,
      "y": 830,
      "scaleX": 1,
      "scaleY": 1,
      "stroke": "black",
      "strokeWidth": 5,
      "fill": "white",
      "name": "rectangle",
      "draggable": true
    },
    "children": [
      {
        "cType": "comic_image",
        "attrs": {
          "id": "32f0c151-596f-4a76-929d-e6aff9705cca",
          "cType": "comic_image",
          "draggable": true,
          "x": 0,
          "y": 0,
          "width": 1000,
          "height": 1300,
          "imageUrls": [
            "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
          ],
          "imageIndex": 0,
          "prompt": "Lumine (Genshin Impact), ",
          "model": "Flux",
          "selectedCharImages": [],
          "referenceImage": null
        },
        "imageUrl": "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
      }
    ],
    "childSorting": [
      "32f0c151-596f-4a76-929d-e6aff9705cca"
    ]
  },
  {
    "cType": "comic_page",
    "attrs": {
      "id": "481ce77c-afab-47f1-8ab1-9a314b334429",
      "height": 700,
      "width": 1000,
      "x": 1030,
      "y": 1430,
      "scaleX": 1,
      "scaleY": 1,
      "stroke": "black",
      "strokeWidth": 5,
      "fill": "white",
      "name": "rectangle",
      "draggable": true
    },
    "children": [
      {
        "cType": "comic_image",
        "attrs": {
          "id": "d5bc8744-6063-4fb7-b1bd-7c32a03d6fe4",
          "cType": "comic_image",
          "draggable": true,
          "x": 0,
          "y": 0,
          "width": 1000,
          "height": 700,
          "imageUrls": [
            "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
          ],
          "imageIndex": 0,
          "prompt": "Lumine (Genshin Impact), ",
          "model": "Flux",
          "selectedCharImages": [],
          "referenceImage": null
        },
        "imageUrl": "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
      }
    ],
    "childSorting": [
      "d5bc8744-6063-4fb7-b1bd-7c32a03d6fe4"
    ]
  },
  {
    "cType": "comic_text",
    "attrs": {
      "id": "90c5cbb0-6b45-4bb7-9daa-8df78159f9bf",
      "x": 0,
      "y": 0,
      "text": "",
      "color": "black",
      "fontFamily": "Wildwords",
      "fontSize": 80,
      "textAlign": "left",
      "stroke": "white",
      "strokeWidth": 0,
      "draggable": true,
      "name": "text",
      "align": "left"
    }
  }
];

export const grid2 = [
  {
    "cType": "comic_page",
    "attrs": {
      "id": "0c06dfbb-aa53-4fd3-a9c2-c00fa896d0c3",
      "height": 800,
      "width": 585,
      "x": 0,
      "y": 100,
      "scaleX": 1,
      "scaleY": 1,
      "stroke": "black",
      "strokeWidth": 5,
      "fill": "white",
      "name": "rectangle",
      "draggable": true
    },
    "children": [
      {
        "cType": "comic_image",
        "attrs": {
          "id": "0a0c3252-965a-4578-a505-f3e5aee5800d",
          "cType": "comic_image",
          "draggable": true,
          "x": 0,
          "y": 0,
          "width": 585,
          "height": 800,
          "imageUrls": [
            "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
          ],
          "imageIndex": 0,
          "prompt": "Lumine (Genshin Impact), ",
          "model": "Flux",
          "selectedCharImages": [],
          "referenceImage": null
        },
        "imageUrl": "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
      }
    ]
  },
  {
    "cType": "comic_page",
    "attrs": {
      "id": "e363bc70-17f9-4e6b-a6c4-4c8ff9bc54a8",
      "height": 800,
      "width": 585,
      "x": 615,
      "y": 100,
      "scaleX": 1,
      "scaleY": 1,
      "stroke": "black",
      "strokeWidth": 5,
      "fill": "white",
      "name": "rectangle",
      "draggable": true
    },
    "children": [
      {
        "cType": "comic_image",
        "attrs": {
          "id": "c44fff5e-2825-4723-ab79-55fe0f02b00d",
          "cType": "comic_image",
          "draggable": true,
          "x": 0,
          "y": 0,
          "width": 585,
          "height": 800,
          "imageUrls": [
            "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
          ],
          "imageIndex": 0,
          "prompt": "Lumine (Genshin Impact), ",
          "model": "Flux",
          "selectedCharImages": [],
          "referenceImage": null
        },
        "imageUrl": "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
      }
    ],
    "childSorting": [
      "c44fff5e-2825-4723-ab79-55fe0f02b00d"
    ]
  },
  {
    "cType": "comic_page",
    "attrs": {
      "id": "fcbb26d8-d5d9-4c1d-b830-ba280f9a60be",
      "height": 2030,
      "width": 800,
      "x": 1230,
      "y": 100,
      "scaleX": 1,
      "scaleY": 1,
      "stroke": "black",
      "strokeWidth": 5,
      "fill": "white",
      "name": "rectangle",
      "draggable": true
    },
    "children": [
      {
        "cType": "comic_image",
        "attrs": {
          "id": "32f0c151-596f-4a76-929d-e6aff9705cca",
          "cType": "comic_image",
          "draggable": true,
          "x": 0,
          "y": 0,
          "width": 800,
          "height": 2030,
          "imageUrls": [
            "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
          ],
          "imageIndex": 0,
          "prompt": "Lumine (Genshin Impact), ",
          "model": "Flux",
          "selectedCharImages": [],
          "referenceImage": null
        },
        "imageUrl": "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
      }
    ],
    "childSorting": [
      "32f0c151-596f-4a76-929d-e6aff9705cca"
    ]
  },
  {
    "cType": "comic_page",
    "attrs": {
      "id": "481ce77c-afab-47f1-8ab1-9a314b334429",
      "height": 1200,
      "width": 1200,
      "x": 0,
      "y": 930,
      "scaleX": 1,
      "scaleY": 1,
      "stroke": "black",
      "strokeWidth": 5,
      "fill": "white",
      "name": "rectangle",
      "draggable": true
    },
    "children": [
      {
        "cType": "comic_image",
        "attrs": {
          "id": "d5bc8744-6063-4fb7-b1bd-7c32a03d6fe4",
          "cType": "comic_image",
          "draggable": true,
          "x": 0,
          "y": 0,
          "width": 1200,
          "height": 1200,
          "imageUrls": [
            "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
          ],
          "imageIndex": 0,
          "prompt": "Lumine (Genshin Impact), ",
          "model": "Flux",
          "selectedCharImages": [],
          "referenceImage": null
        },
        "imageUrl": "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
      }
    ],
    "childSorting": [
      "d5bc8744-6063-4fb7-b1bd-7c32a03d6fe4"
    ]
  },
  {
    "cType": "comic_text",
    "attrs": {
      "id": "90c5cbb0-6b45-4bb7-9daa-8df78159f9bf",
      "x": 0,
      "y": 0,
      "text": "",
      "color": "black",
      "fontFamily": "Wildwords",
      "fontSize": 80,
      "textAlign": "left",
      "stroke": "white",
      "strokeWidth": 0,
      "draggable": true,
      "name": "text",
      "align": "left"
    }
  }

];

export const grid3 = [
  {
    "cType": "comic_page",
    "attrs": {
      "id": "0c06dfbb-aa53-4fd3-a9c2-c00fa896d0c3",
      "height": 1000,
      "width": 1300,
      "x": 0,
      "y": 100,
      "scaleX": 1,
      "scaleY": 1,
      "stroke": "black",
      "strokeWidth": 5,
      "fill": "white",
      "name": "rectangle",
      "draggable": true
    },
    "children": [
      {
        "cType": "comic_image",
        "attrs": {
          "id": "0a0c3252-965a-4578-a505-f3e5aee5800d",
          "cType": "comic_image",
          "draggable": true,
          "x": 0,
          "y": 0,
          "width": 1300,
          "height": 1000,
          "imageUrls": [
            "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
          ],
          "imageIndex": 0,
          "prompt": "Lumine (Genshin Impact), ",
          "model": "Flux",
          "selectedCharImages": [],
          "referenceImage": null
        },
        "imageUrl": "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
      }
    ]
  },
  {
    "cType": "comic_page",
    "attrs": {
      "id": "e363bc70-17f9-4e6b-a6c4-4c8ff9bc54a8",
      "height": 1000,
      "width": 700,
      "x": 1330,
      "y": 100,
      "scaleX": 1,
      "scaleY": 1,
      "stroke": "black",
      "strokeWidth": 5,
      "fill": "white",
      "name": "rectangle",
      "draggable": true
    },
    "children": [
      {
        "cType": "comic_image",
        "attrs": {
          "id": "c44fff5e-2825-4723-ab79-55fe0f02b00d",
          "cType": "comic_image",
          "draggable": true,
          "x": 0,
          "y": 0,
          "width": 700,
          "height": 1000,
          "imageUrls": [
            "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
          ],
          "imageIndex": 0,
          "prompt": "Lumine (Genshin Impact), ",
          "model": "Flux",
          "selectedCharImages": [],
          "referenceImage": null
        },
        "imageUrl": "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
      }
    ],
    "childSorting": [
      "c44fff5e-2825-4723-ab79-55fe0f02b00d"
    ]
  },
  {
    "cType": "comic_page",
    "attrs": {
      "id": "fcbb26d8-d5d9-4c1d-b830-ba280f9a60be",
      "height": 1000,
      "width": 700,
      "x": 0,
      "y": 1130,
      "scaleX": 1,
      "scaleY": 1,
      "stroke": "black",
      "strokeWidth": 5,
      "fill": "white",
      "name": "rectangle",
      "draggable": true
    },
    "children": [
      {
        "cType": "comic_image",
        "attrs": {
          "id": "32f0c151-596f-4a76-929d-e6aff9705cca",
          "cType": "comic_image",
          "draggable": true,
          "x": 0,
          "y": 0,
          "width": 700,
          "height": 1000,
          "imageUrls": [
            "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
          ],
          "imageIndex": 0,
          "prompt": "Lumine (Genshin Impact), ",
          "model": "Flux",
          "selectedCharImages": [],
          "referenceImage": null
        },
        "imageUrl": "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
      }
    ],
    "childSorting": [
      "32f0c151-596f-4a76-929d-e6aff9705cca"
    ]
  },
  {
    "cType": "comic_page",
    "attrs": {
      "id": "481ce77c-afab-47f1-8ab1-9a314b334429",
      "height": 1000,
      "width": 1300,
      "x": 730,
      "y": 1130,
      "scaleX": 1,
      "scaleY": 1,
      "stroke": "black",
      "strokeWidth": 5,
      "fill": "white",
      "name": "rectangle",
      "draggable": true
    },
    "children": [
      {
        "cType": "comic_image",
        "attrs": {
          "id": "d5bc8744-6063-4fb7-b1bd-7c32a03d6fe4",
          "cType": "comic_image",
          "draggable": true,
          "x": 0,
          "y": 0,
          "width": 1300,
          "height": 1000,
          "imageUrls": [
            "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
          ],
          "imageIndex": 0,
          "prompt": "Lumine (Genshin Impact), ",
          "model": "Flux",
          "selectedCharImages": [],
          "referenceImage": null
        },
        "imageUrl": "https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/image_generation/39b76943-b27a-44ac-8798-0bd7d0f5f473/purecolor.webp"
      }
    ],
    "childSorting": [
      "d5bc8744-6063-4fb7-b1bd-7c32a03d6fe4"
    ]
  },
  {
    "cType": "comic_text",
    "attrs": {
      "id": "90c5cbb0-6b45-4bb7-9daa-8df78159f9bf",
      "x": 0,
      "y": 0,
      "text": "",
      "color": "black",
      "fontFamily": "Wildwords",
      "fontSize": 80,
      "textAlign": "left",
      "stroke": "white",
      "strokeWidth": 0,
      "draggable": true,
      "name": "text",
      "align": "left"
    }
  }
];

export const grid4 = createGrid(createLayout({
  cols: 2,
  rows: 3,
  width: 2030,
  height: 3160,
  ratioDir: 'column',
  ratio: [[1, 1], [1, 1], [1, 1]]
}))

export const grid5 = createGrid(createLayout({
  cols: 2,
  rows: 3,
  width: 2030,
  height: 3160,
  ratioDir: 'column',
  ratio: [[3, 5], [1, 1], [5, 3]]
}))

export const grid6 = createGrid(createLayout({
  cols: 2,
  rows: 3,
  width: 2030,
  height: 3160,
  ratioDir: 'row',
  ratio: [[2, 3, 4], [4, 2, 3]]
}))

export const grid7 = createGrid(createLayout({
  cols: 2,
  rows: 4,
  width: 2030,
  height: 4190,
  ratioDir: 'column',
  ratio: [[1, 1], [1, 1], [1, 1], [1, 1]]
}))
