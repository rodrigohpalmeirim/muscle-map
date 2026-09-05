/* Stylised anatomy plate, drawn on a 200 x 400 grid with the centre line at
   x = 100. Shapes are authored once for the viewer's left half and mirrored, so
   the figure stays symmetrical and there is half as much path data to maintain.
   A muscle may be several paths (e.g. the two heads of the calf); every path
   carries the same data-muscle, so they light up together. */

const MIRROR = 'matrix(-1,0,0,1,200,0)';

const SILHOUETTE =
  'M101,9 C88,9 82,19 82,32 C82,45 89,54 97,56 L94,58' +
  'C92,62 90,66 86,69 C74,70 56,71 47,79 C37,87 32,98 33,108' +
  'C33,120 31,140 30,158 C27,174 24,202 25,226 C24,240 28,254 33,253' +
  'C38,252 39,240 38,226 C38,206 41,182 44,164 C47,148 49,128 50,110' +
  'C51,101 53,97 59,96 C63,102 62,116 65,132 C68,143 73,149 77,157' +
  'C76,165 72,169 70,176 C68,186 70,191 76,193 C68,199 65,212 66,230' +
  'C67,250 70,268 74,284 C76,292 76,300 76,310 C75,326 76,344 80,360' +
  'C82,372 82,380 81,386 C80,392 84,396 93,396 C97,396 96,391 95,385' +
  'C94,371 93,350 94,330 C95,310 96,300 96,290 C97,268 98,236 99,212' +
  'C101,200 101,196 101,192 L101,9 Z';

// Shared between the two views: the arm segments and the lateral delt sliver.
const UPPER_ARM =
  'M50,102 C43,102 37,110 35,124 C33,138 34,152 37,161' +
  'C42,163 46,157 47,145 C48,128 49,112 50,102 Z';
const FOREARM =
  'M46,168 C38,166 31,174 29,190 C27,206 28,224 30,236' +
  'C33,240 37,238 38,230 C40,212 43,188 46,168 Z';
// The two triceps heads subdivide the same upper-arm footprint as UPPER_ARM:
// the long head runs down the inner side, the lateral and medial heads outside it.
const TRICEPS_LONG =
  'M50,102 C48,112 47,130 47,146 C46,153 43,155 41,150' +
  'C41,133 42,116 44,106 C46,103 48,102 50,102 Z';
const TRICEPS_LATERAL =
  'M44,106 C38,107 36,113 35,124 C33,138 34,152 37,161' +
  'C40,163 42,157 41,150 C41,133 42,116 44,106 Z';
const DELT_SIDE =
  'M45,78 C38,84 33,95 34,107 C35,114 42,115 45,109 C42,99 42,86 47,80 Z';

const SHAPES = {
  front: {
    neck:       'M97,54 C94,56 91,60 90,65 C89,69 92,71 95,70 C97,66 98,59 97,54 Z',
    trapsUpper: 'M101,58 C94,60 86,64 81,70 C77,75 78,80 83,80 C88,74 94,70 101,68 Z',
    deltFront:  'M72,74 C64,70 52,71 45,79 C40,86 39,97 43,104 C52,101 63,93 70,84 Z',
    deltSide:   DELT_SIDE,
    chestUpper: 'M101,74 C94,74 85,76 80,80 C77,84 76,89 77,95 C85,98 93,99 99,97 C99,89 100,81 101,74 Z',
    chestLower: 'M99,97 C93,99 85,98 77,95 C76,101 77,107 80,110 C86,116 94,121 100,120 C98,112 98,104 99,97 Z',
    lats:       'M71,98 C64,101 62,114 65,128 C69,133 75,130 76,118 C76,108 73,102 71,98 Z',
    obliques:   'M84,117 C76,121 69,132 69,144 C71,153 76,160 81,166 C86,169 90,164 88,154 C85,141 83,130 84,117 Z',
    abs:        'M101,120 C93,120 86,124 85,133 C84,144 84,155 87,166 C89,175 93,181 97,183 L101,183 Z',
    quads:      'M92,195 C81,193 71,199 67,211 C63,226 65,245 70,261 C74,273 80,281 86,283 C90,277 92,262 92,240 C92,222 92,206 92,195 Z',
    adductors:  'M101,194 C96,194 91,199 89,210 C87,223 89,239 93,250 C97,253 101,249 101,236 Z',
    gastroc:    'M92,300 C85,298 79,304 77,315 C76,322 76,329 77,334 C82,338 88,337 91,333 C92,322 92,310 92,300 Z',
    soleus:     'M91,333 C87,337 82,338 77,334 C77,341 79,348 82,354 C85,362 88,364 90,361 C91,352 91,342 91,333 Z',
    biceps:     UPPER_ARM,
    forearms:   FOREARM,
  },
  back: {
    neck:       'M101,52 C97,53 94,57 93,63 C92,67 95,69 98,68 C100,63 101,57 101,52 Z',
    trapsUpper: 'M101,54 C91,57 81,63 77,71 C74,77 76,85 82,87 C89,80 95,74 101,71 Z',
    trapsMid:   'M101,76 C93,79 85,86 82,96 C80,108 84,124 89,134 C94,137 98,132 99,120 C100,106 101,88 101,76 Z',
    deltRear:   'M71,74 C63,70 52,72 46,80 C41,87 40,98 44,105 C53,102 64,93 71,84 Z',
    deltSide:   DELT_SIDE,
    lats:       'M71,95 C62,102 60,120 64,137 C68,151 75,159 82,163 C87,161 89,150 87,139 C84,126 82,110 81,94 C78,91 74,92 71,95 Z',
    obliques:   'M86,132 C81,133 78,140 78,150 C78,160 81,170 85,176 C89,178 91,172 90,163 C88,152 86,142 86,132 Z',
    erectors:   'M101,130 C95,131 90,139 90,152 C90,166 93,180 97,188 L101,188 C102,168 102,148 101,130 Z',
    abductors:  'M76,168 C70,170 66,177 66,188 C66,194 70,197 74,194 C77,187 77,176 76,168 Z',
    glutes:     'M101,188 C92,186 81,190 75,199 C71,207 72,218 78,225 C85,233 94,235 101,232 C102,217 102,202 101,188 Z',
    hamstrings: 'M97,236 C88,234 77,238 71,247 C68,258 69,272 73,283 C76,291 81,295 86,293 C91,288 94,275 95,260 C96,248 97,242 97,236 Z',
    gastroc: [
      'M95,298 C89,297 83,302 81,312 C79,324 80,334 83,342 C88,346 93,344 94,338 C96,326 96,314 95,298 Z',
      'M80,302 C77,306 76,316 77,327 C78,334 79,339 81,342 C83,340 82,332 81,325 C80,316 80,308 80,302 Z',
    ],
    soleus:     'M94,338 C89,344 84,346 80,341 C79,348 80,356 83,364 C86,371 90,371 92,366 C94,356 94,346 94,338 Z',
    tricepsLong:    TRICEPS_LONG,
    tricepsLateral: TRICEPS_LATERAL,
    forearms:   FOREARM,
  },
};

// Hairlines that give the plate its read: joints, sternum, spine, ab segments.
const DETAIL = {
  front: [
    'M82,72 C88,68 93,66 98,65',
    'M100,76 L100,186',
    'M87,133 L100,133 M87,146 L100,146 M87,159 L100,159',
    'M76,286 C82,292 90,292 96,287',
    'M37,164 C41,168 45,167 47,163',
  ],
  back: [
    'M100,72 L100,188',
    'M82,90 C87,97 91,106 93,117',
    'M76,228 C83,233 91,233 98,229',
    'M76,286 C82,292 90,292 96,287',
    'M37,164 C41,168 45,167 47,163',
  ],
};

function muscleMarkup(view) {
  return Object.entries(SHAPES[view])
    .map(([id, d]) => (Array.isArray(d) ? d : [d])
      .map((one) => `<path class="muscle" data-muscle="${id}" d="${one}"/>`)
      .join(''))
    .join('');
}

// Both halves of a layer are drawn before the next layer starts, so the
// hairlines are never covered by the mirrored copy of a muscle.
function layer(inner) {
  return `<g>${inner}</g><g transform="${MIRROR}">${inner}</g>`;
}

// A clipPath only honours shape children, so the two halves go in as bare
// paths rather than through layer().
function bodyClip(id) {
  return `<clipPath id="${id}">` +
    `<path d="${SILHOUETTE}"/><path d="${SILHOUETTE}" transform="${MIRROR}"/>` +
    `</clipPath>`;
}

function figureSvg(view) {
  const clip = `clip-${view}`;
  const body = layer(`<path class="body" d="${SILHOUETTE}"/>`);
  const muscles = layer(muscleMarkup(view));
  const detail = layer(DETAIL[view].map((d) => `<path class="detail" d="${d}"/>`).join(''));
  return `<svg class="figure" viewBox="0 0 200 400" role="img"
    aria-label="${view === 'front' ? 'Front' : 'Back'} view of the body, shaded by how hard each muscle works"
    ><defs>${bodyClip(clip)}</defs>
    ${body}<g clip-path="url(#${clip})">${muscles}</g>${detail}</svg>`;
}

const FIGURES = { front: figureSvg('front'), back: figureSvg('back') };
