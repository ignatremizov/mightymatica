# Original illustrated cube face stills

These PNGs are the first frame of the six complete face sprites in Yuri
Remizov's original `Movies/Cubeflash-text.swf`. They replace the earlier
individual bitmap/body-part details in the native rotating cube.

Source, kept read-only:
`/home/ignat/code/mightymatica-source-recovery/objects/Movies/Cubeflash-text/original/Cubeflash-text.swf`.

The recovered XFL cube `Symbol 161` references face symbols
`27`, `57`, `87`, `113`, `136`, and `160`. The exported artwork depicts the
green caterpillar face, cyan cat face, blue squirrel face, pink mouse face,
magenta globe face, and yellow turtle face respectively. Nested artwork is
rendered at its first frame by FFDec; no ActionScript is executed.

Extracted with the existing local JPEXS FFDec 26.2.1 installation and
`scripts/export-original-frames.mjs`, once for each face ID:

```sh
node scripts/export-original-frames.mjs \
  --source /home/ignat/code/mightymatica-source-recovery/objects/Movies/Cubeflash-text/original/Cubeflash-text.swf \
  --sprite 57 --frames 1 --format png \
  --output public/media/spatial/cube-faces
```

The existing helper serializes extraction with a shared lock and limits Java
to two active processors, a 768 MB heap, and a 120-second export timeout.
Only these six selected sprite frames were exported, not the movie timeline.

The application uses static face textures on native CSS 3D geometry. Face
placement is adapted; internal character animation is not restored.
Preservation does not grant a new license to the original illustrations.
