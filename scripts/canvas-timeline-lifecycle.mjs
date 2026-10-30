/** Mechanical lifecycle patch shared by fresh conversion and legacy refresh. */
export function addContextLifecycle(source) {
  if (source.includes("// Context lifecycle v2")) return source;
  const start = "export async function createTimeline(canvas) {\n";
  const ready = /await Promise\.all\(\[([^\]]*)\]\.map\(image => image\.decode\(\)\)\);/;
  const images = source.match(ready)?.[1];
  if (images === undefined || !/^(?:imageObj\d+(?:,imageObj\d+)*)?$/.test(images)) {
    throw new Error("Unrecognized generated image readiness.");
  }
  const tail = /  dispose\(\) \{ ([^\n]*) \}\n\};\n\}\n$/;
  const previousDispose = source.match(tail)?.[1];
  const expectedDispose = images.split(",").filter(Boolean)
    .map((name) => `${name}.removeAttribute("src");`).join(" ");
  if (previousDispose !== expectedDispose || source.split(start).length !== 2
    || source.split("  draw(frame, time = 0) {\n").length !== 2) {
    throw new Error("Unrecognized generated lifecycle.");
  }
  const prefix = `// Context lifecycle v2: restore canvas ownership before reuse.
const _timelineContext = canvas.getContext("2d");
if (!_timelineContext) throw new Error("Canvas 2D is unavailable.");
const _timelineOwner = Symbol.for("mightymatica.originalTimeline.contextOwner.v2");
if (typeof _timelineContext[_timelineOwner] === "function") _timelineContext[_timelineOwner]();
const _timelineKeys = ["save","restore","scale","rotate","translate","transform","setTransform","resetTransform","applyTransforms","applyTransformToPoint","_matrix","_savedMatrices"];
const _timelineDescriptors = _timelineKeys.map(key => Object.getOwnPropertyDescriptor(_timelineContext,key));
let _timelineDisposed = false;
function _timelineRelease() {
  if (_timelineDisposed) return;
  _timelineDisposed = true;
  if (_timelineContext[_timelineOwner] === _timelineRelease) {
    for (let index = 0; index < _timelineKeys.length; index++) {
      const key = _timelineKeys[index];
      const descriptor = _timelineDescriptors[index];
      if (descriptor) Object.defineProperty(_timelineContext,key,descriptor);
      else delete _timelineContext[key];
    }
    delete _timelineContext[_timelineOwner];
  }
  for (const image of [${images}]) image?.removeAttribute("src");
}
_timelineContext[_timelineOwner] = _timelineRelease;
try {
`;
  return source.replace(start, start + prefix)
    .replace(ready, `$&\nif (_timelineDisposed) throw new Error("Timeline replaced during preparation.");`)
    .replace("  draw(frame, time = 0) {\n", "  draw(frame, time = 0) {\n    if (_timelineDisposed) return;\n")
    .replace(tail, `  dispose: _timelineRelease
};
} catch (error) {
  _timelineRelease();
  throw error;
}
}
`);
}
