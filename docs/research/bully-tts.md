# Озвучивание реплики буллера в PWA без сервера

**Вопрос Issue #11.** Какие браузерные возможности позволяют произнести реплику персонажа-буллера на устройстве ученика; это исследовательская заметка, а не технологическое решение.

## Установленные факты

### Web Speech Synthesis

- Веб-платформа определяет `SpeechSynthesis` как контроллер синтеза речи: он получает доступ к доступным голосам, начинает и останавливает озвучивание. Текст и параметры запроса (в частности язык, высота и громкость) представлены `SpeechSynthesisUtterance`; добавление такого запроса в очередь выполняет `SpeechSynthesis.speak()`. [MDN: Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) · [MDN: SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis) · [MDN: `speak()`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/speak)
- Это API браузерного `Window`, а не API сервера: доступ к нему получается через `window.speechSynthesis`. Следовательно, сама операция передачи строки в синтезатор не требует собственного серверного endpoint приложения. [MDN: Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- Стандартная модель API передаёт строку в голосовой сервис, но не стандартизирует конкретный движок или набор его голосов. У голоса имеются лишь имя, BCP 47-язык, URI сервиса, флаг `default` и флаг `localService`. [WICG Web Speech API: `SpeechSynthesisVoice`](https://wicg.github.io/speech-api/#speechsynthesisvoice) · [MDN: SpeechSynthesisVoice](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice)
- Список голосов принадлежит текущему устройству и может меняться; API сообщает об этом событием `voiceschanged`. В документации MDN отдельно отмечено, что в Chrome голоса могут ещё не быть готовы при загрузке страницы. [MDN: SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis) · [MDN: SpeechSynthesisUtterance](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance)

### Локальный синтез, сеть и данные

- `SpeechSynthesisVoice.localService === true` означает, что голос поставляет локальный сервис синтеза; `false` — удалённый сервис. Это предоставляемый API признак местонахождения голосового сервиса. [MDN: `localService`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService) · [WICG Web Speech API: `localService`](https://wicg.github.io/speech-api/#dom-speechsynthesisvoice-localservice)
- Поэтому озвучивание **может** происходить на устройстве без сети, если при запуске выбран голос с `localService === true` и локальный сервис доступен. Для удалённого голоса стандарт допускает дополнительные задержку, трафик и стоимость; офлайн-работу такого голоса утверждать нельзя. [MDN: `localService`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService)
- Для данных реплики документирован только статус самого голосового сервиса: локальный либо удалённый. Web Speech API не задаёт контракт о сетевом маршруте, хранении, юрисдикции или сроке обработки текста; значит, эти свойства нельзя заявлять как локальные для удалённого голоса без документации поставщика сервиса. [WICG Web Speech API: `SpeechSynthesisVoice`](https://wicg.github.io/speech-api/#speechsynthesisvoice) · [MDN: `localService`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService)

### Выбор голоса и «подростковость»

- Можно выбрать только объект из фактического результата `getVoices()`; если голос не задан, используется наиболее подходящий голос по умолчанию для языка реплики. [MDN: `SpeechSynthesisUtterance.voice`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/voice)
- У Web Speech API нет свойства возраста, пола, «подростковости» или тембра голоса. Управляемые параметры запроса — язык, голос, громкость, скорость и высота; отдельные голоса могут не поддерживать изменение параметров. Поэтому API не позволяет гарантированно запросить teen-like voice: такой результат возможен только если подходящий голос уже есть в списке конкретного устройства и его свойства устраивают при прослушивании. [MDN: SpeechSynthesisUtterance](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance) · [Chrome for Developers: параметры и список голосов](https://developer.chrome.com/blog/web-apps-that-talk-introduction-to-the-speech-synthesis-api)

### iOS / Safari

- Исходный код WebKit для семейства iOS вводит ограничение `RequireUserGestureForSpeechStartRestriction`, когда документ требует пользовательский жест для аудиовоспроизведения. Следовательно, нельзя считать автоматический старт речи на iOS гарантированным: запуск надо проверять именно в Safari/PWA на целевой версии iOS. [WebKit changeset 291124](https://trac.webkit.org/changeset/291124/webkit/)
- В пояснении WebKit к политике воспроизведения «результат пользовательского жеста» означает JavaScript, непосредственно вызванный обработчиком `touchend`, `click`, `doubleclick` или `keydown`; вызов из последующего события не удовлетворяет этому критерию. Это документирует модель жеста для медиаполитики iOS, согласующуюся с ограничением синтеза в исходном коде выше. [WebKit: New video policies for iOS](https://webkit.org/blog/6784/new-video-policies-for-ios/)
- Публичная документация WebKit/MDN в использованных источниках не обещает ни фиксированный набор голосов, ни локальность конкретного голоса на iOS. Их нужно получать и оценивать на устройстве через `getVoices()` и `localService`. [MDN: SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis) · [MDN: `localService`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService)

### Android / Chrome

- Chrome for Developers документирует Web Speech API как доступный в Chrome начиная с Chrome 33 на мобильных и настольных устройствах; при этом рекомендует отдельно обнаруживать `speechSynthesis`, поскольку части Web Speech API могут поддерживаться раздельно. [Chrome for Developers: Web apps that talk](https://developer.chrome.com/blog/web-apps-that-talk-introduction-to-the-speech-synthesis-api)
- На Android нельзя заранее полагаться на единый набор голосов, локальность или готовность списка: список берётся с текущего устройства, а в Chrome загрузка голосов может быть асинхронной. Доступность синтеза и подходящего локального голоса — наблюдаемые свойства конкретного браузера и устройства, а не гарантия PWA или Lit. [MDN: SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis) · [MDN: SpeechSynthesisUtterance](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance)

## Границы выводов

- Из этих источников следует возможность браузерного локального TTS, но не гарантия, что он будет доступен, офлайн, одинаково звучать или содержать голос нужного возраста на каждом устройстве ученика. Основание для этой границы — устройство-зависимый список голосов и различение local/remote voice. [MDN: SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis) · [MDN: SpeechSynthesisVoice](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice)
- Заметка намеренно не выбирает API, поставщика голоса, UX запуска или способ проверки; это потребовало бы продуктового решения и испытаний на целевых iOS/Android-устройствах.

## Использованные первичные источники

1. [WICG Web Speech API](https://wicg.github.io/speech-api/) — спецификация объектов синтеза и признака `localService`.
2. [MDN: Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API), [SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis), [SpeechSynthesisVoice](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice) и [SpeechSynthesisUtterance](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance) — официальная документация веб-платформы и её браузерная совместимость.
3. [WebKit changeset 291124](https://trac.webkit.org/changeset/291124/webkit/) и [WebKit: New video policies for iOS](https://webkit.org/blog/6784/new-video-policies-for-ios/) — реализация и политика пользовательского жеста на iOS.
4. [Chrome for Developers: Web apps that talk](https://developer.chrome.com/blog/web-apps-that-talk-introduction-to-the-speech-synthesis-api) — Chrome-реализация и особенности голосов.
