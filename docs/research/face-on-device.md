# Оценка лица на устройстве в браузере

Дата проверки: 2026-08-21. Это исследование фиксирует технические факты и ограничения, а не выбирает стек.

## Границы решения

Для тренажёра камера — необязательная возможность в **сцене**. Лицо не является ни
**оценкой хода**, ни **характеристикой**, ни **приростом**: эти три системы
измерения уже определены отдельно в [CONTEXT.md](../../CONTEXT.md) и
[ADR-0001](../adr/0001-three-measurement-systems.md). Следовательно, отсутствие
камеры, отказ в доступе или отсутствие распознанного лица не могут менять исход
сцены либо значения этих систем.

«На устройстве без отправки видео» означает одновременно:

1. камера выдаёт `MediaStream` странице;
2. кадры передаются только в локально исполняемый код распознавания;
3. приложение не выполняет сетевую передачу самих кадров или результатов, из
   которых это предполагается.

`getUserMedia()` сам по себе создаёт поток для страницы; он не является API
отправки видео. Официальное privacy notice MediaPipe Tasks заявляет, что
обработка входных изображений и видео происходит на устройстве и этот вход не
посылается серверам Google. Однако тот же документ говорит, что Tasks отправляет
Google метрики производительности и использования API. Поэтому «без отправки
видео» подтверждается для входных кадров, но «всё без какой-либо сети» не
следует заявлять без учёта телеметрии, загрузки WASM/модели и сетевого кода
самого приложения. [MediaPipe Tasks Vision: Privacy
Notice](https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/mediapipe/tasks/web/vision/README.md)

## Первичные браузерные механизмы

### Захват камеры: Media Capture and Streams

- Стандартный вход — `navigator.mediaDevices.getUserMedia({ video: ... })`.
  Он запрашивает у ученика разрешение и при согласии возвращает `MediaStream`.
  API доступен только в безопасном контексте; в небезопасном
  `navigator.mediaDevices` недоступен. [MDN: getUserMedia — secure context,
  permission и результат](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia);
  [W3C Media Capture and Streams](https://www.w3.org/TR/mediacapture-streams/#dom-mediadevices-getusermedia)
- Браузер требует разрешение перед открытием видеовхода и показывает индикатор
  использования камеры. [MDN: privacy and security](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#privacy_and_security)
- API позволяет остановить захват: после `MediaStreamTrack.stop()` источник
  прекращается, когда остановлены все его треки. [W3C: stopping a
  source](https://www.w3.org/TR/mediacapture-streams/#source-stopped)

### Локальная оценка лица: MediaPipe Tasks для Web

- Google документирует JavaScript/Web API `FaceLandmarker` в пакете
  `@mediapipe/tasks-vision`; для него требуются WASM-ресурсы и совместимая
  модель. Модель может быть задана как путь или как уже загруженный в память
  буфер. [Google AI Edge: Face Landmarker for Web](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker/web_js)
- `detectForVideo()` принимает кадры видео; вызовы синхронны и блокируют
  UI-поток, поэтому Google прямо указывает Web Worker как способ не блокировать
  основной поток. [Google AI Edge: video mode](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker/web_js#run_the_task)
- Заявленные результаты задачи: 478 трёхмерных landmarks лица, 52 коэффициента
  blendshape (коэффициенты выражений) и матрицы преобразования лица. Это
  координаты и оценки модели, а не подтверждённые эмоциональные состояния
  ученика. [Google AI Edge: обзор и выходы модели](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker)
- В текущем руководстве Google называет прежний MediaPipe Face Mesh
  «upgraded» в Face landmark detection. Поэтому «FaceMesh» — историческое имя,
  а не отдельный нативный Web API браузера. [Google AI Edge: migration
  table](https://ai.google.dev/edge/mediapipe/solutions/guide)

## Что известно о модели и лицензировании

- Официальный bundle `face_landmarker.task` по URL Google Cloud Storage на
  дату проверки имеет `Content-Length: 3 758 596` байт (около 3,59 MiB). Это
  размер именно указанной версии `float16/latest`, а не обещание неизменного
  размера будущего `latest`: [заголовки официального
  файла](https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task).
- В bundle объединены детектор лица, Face Mesh и предиктор blendshape; Google
  описывает их и входные размеры (192×192 для детектора, 256×256 для
  FaceMesh-V2), но не публикует единую норму размера для всех версий bundle.
  [Google AI Edge: models](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker#models)
- Репозиторий MediaPipe распространяется по Apache License 2.0; она даёт
  воспроизводимую, всемирную, безвозмездную лицензию на код при выполнении
  условий распространения, включая передачу текста лицензии. [Официальный
  LICENSE MediaPipe](https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE)
- Лицензия репозитория сама по себе не доказывает лицензию любого отдельно
  скачиваемого веса модели. Для компонентов FaceMesh V2 и Blendshape V2
  официальные model cards явно указывают Apache License 2.0. Это не заменяет
  проверку лицензии всего скачиваемого bundle `face_landmarker.task`, включая
  остальные его компоненты, перед распространением модели вместе с продуктом.
  [Model Card: FaceMesh V2](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Face%20Mesh%20V2.pdf);
  [Model Card: Blendshape V2](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Blendshape%20V2.pdf)

## Нет камеры, отказ или недоступность

| Состояние | Наблюдаемый факт браузера | Ограничение для сцены |
| --- | --- | --- |
| Ученик отказал или доступ запрещён политикой/браузером | `getUserMedia()` отклоняется с `NotAllowedError`; причиной также может быть HTTP вместо HTTPS или `Permissions-Policy`. [MDN: exceptions](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#exceptions) | Продолжить сцену без камеры и не повторять запрос без явного нового действия ученика. |
| Нет подходящей камеры | При отсутствии устройства, удовлетворяющего video constraints, Promise отклоняется с `NotFoundError`. [MDN: constraints и NotFoundError](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#parameters) | Продолжить сцену без камеры. |
| Ученик не ответил на prompt | Promise может не завершиться вовсе: браузер не обязан заставлять сделать выбор. [MDN: return value](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#return_value) | Не блокировать сцену ожиданием камеры; дать явный путь продолжить без неё. |
| Камера есть, но не доступна документу | `Permissions-Policy: camera` может запретить видеовход; политика по умолчанию — `self`. [MDN: `camera` directive](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy/camera) | Считать это таким же необязательным отказом возможности. |

Не следует предварительно определять «есть ли камера» по названию устройства:
до разрешения `enumerateDevices()` может не показывать не-default устройства, а
их `label` пуст без активного потока либо постоянного разрешения. [MDN:
enumerateDevices](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices);
[MDN: MediaDeviceInfo.label](https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo/label)

## Границы интерпретации

Официальные model cards описывают FaceMesh V2 и Blendshape V2 как модели для
AR-развлечений, не для жизненно важных решений, распознавания или идентификации
человека. Они также предупреждают об ухудшении качества при плохом освещении,
шуме, движении, перекрытии лица, большом повороте головы либо частичной
видимости. Поэтому коэффициенты blendshape нельзя считать подтверждёнными
эмоциями, правдивостью, самообладанием или качеством хода.
[Model Card: FaceMesh V2](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Face%20Mesh%20V2.pdf);
[Model Card: Blendshape V2](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Blendshape%20V2.pdf)

## Выводы без выбора реализации

1. Браузер предоставляет стандартизованный, permission-gated доступ к
   видеопотоку; MediaPipe предоставляет документированный Web-путь к landmarks
   и blendshape на поступающих кадрах.
2. Входные кадры MediaPipe Tasks обрабатывает на устройстве и не отправляет
   Google, но для строгой локальности нужно также учитывать телеметрию Tasks,
   загрузку WASM/модели и сетевой код приложения.
3. Камера и модель не являются необходимыми условиями сцены; результат
   распознавания лица не должен становиться четвёртой шкалой измерения.
