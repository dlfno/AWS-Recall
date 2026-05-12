# Íconos de servicios

Los íconos oficiales de AWS son **trademarks de Amazon Web Services** (ver
`NOTICE` en la raíz del repo). Esta carpeta contiene:

- `<service-id>.svg` — 84 íconos de servicio (64×64) listos para que
  `ServiceIcon` los cargue desde `/icons/<id>.svg`.
- `icon-map.md` — tabla autogenerada de service ID → nombre/acrónimo oficial.
- `../Asset-Package_07312025.../` — paquete oficial completo extraído, usado
  como fuente al ejecutar el instalador.

## Regenerar los íconos

Si actualizas `data/services.json` o AWS publica un release nuevo del paquete,
reinstala con:

```bash
node scripts/install-icons.mjs               # autodetecta el paquete en public/
node scripts/install-icons.mjs <ruta>        # o especifica la ruta
ICON_SIZE=48 node scripts/install-icons.mjs  # otra resolución (16, 32, 48, 64)
```

Cuando agregues servicios, regenera también el mapa:

```bash
node scripts/gen-icon-map.mjs > public/icons/icon-map.md
```

## Notas

- El paquete oficial usa nombres tipo `Arch_Amazon-EC2_64.svg`. El instalador
  prueba varios patrones (`name`, `fullName`, sin prefijo Amazon/AWS) y tiene
  overrides explícitos para servicios cuyos SVGs no siguen el patrón base
  (Glacier, Snow Family, WorkSpaces, AppStream).
- Si AWS rebrand un servicio o cambia el nombre del archivo en un release
  futuro, añade el override en `scripts/install-icons.mjs` (constante
  `OVERRIDES`).
- `ServiceIcon` cae a un placeholder con acrónimo + color de categoría si
  algún archivo falta — la app no se rompe.

## Licencia

Los íconos son trademark de Amazon.com, Inc. Su uso aquí es nominativo (para
identificar el servicio que estás estudiando), conforme a las
[trademark guidelines](https://aws.amazon.com/trademark-guidelines/) de AWS.
No están modificados ni recoloreados.
