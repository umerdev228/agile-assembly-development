# Agile Assembly (Technische Dokumentation)

## Entwicklungsumgebung einrichten
1. Yarn oder NPM als Paketmanager installieren
    * Yarn: https://classic.yarnpkg.com/en/docs/install (empfohlen)
    * _oder_ NPM: https://www.npmjs.com/get-npm
2. Entwicklungsumgebung installieren
    * WebStorm: https://www.jetbrains.com/webstorm/ (empfohlen - kostenlos mit EDU account)
    * VS Code: https://code.visualstudio.com/
3. Git installieren (falls nicht vorhanden)
    * https://git-scm.com/downloads
4. RWTH GitLab Account einrichten (https://git.rwth-aachen.de/)
    * Zugang zum Projekt **agile-assembly** erhalten durch Projekt-Owner (Esbend Schukat, Hannes Kahmann).
5. GitLab Version-Control-System (VCS) mit der Entwicklungsumgebung (IDE) verknüpfen
    * VS Code: https://code.visualstudio.com/docs/editor/versioncontrol
    * WebStorm: https://www.jetbrains.com/help/idea/enabling-version-control.html

#### Was ist Git und wozu braucht man das?
Git nennt sich Source Code Management System, meist spricht man von Versionsverwaltung, und in der Praxis macht Git vor allem eines: Änderungen an Dateien so zu speichern und aufzuzeichnen, dass sie jederzeit nachvollziehbar sind. Sie fügen Dateien hinzu, machen Änderungen, speichern diese und sichern sie optional auf einem entfernten Server. Für jeden Speichervorgang wird ein Marker gesetzt, der später erneut aufgerufen werden kann.

Git speichert im Gegensatz zu Backup-Programmen oder den meisten sonstigen Versionsverwaltungen keine neuen Dateien. Weder Kopien veränderter Dateien, noch Dateien, die nur die Änderungen enthalten. Wenn Sie auf Dateisystemebene in Ihren Git-Ordner schauen, finden Sie dort immer nur die jeweils aktuellen Versionen der Dateien, die Sie selbst hinzugefügt haben.

#### Das Git Prinzip in der Praxis
* Repositoriy: Das gesamte Projekt mit allem Code wird repository genannt
* Origin: Origin beschreibt die Version des Repositories, die online ist
* Commit: Nachverfolgung bzw. Speicherung einer spezifischen Änderung versehen mit einem Kommentar (Commit-Message), der die Änderung für andere nachvollziehbar macht.
* Push: Upload der (bis dahin) lokalen Commits zum Origin
* Pull: Herunterladen aller Änderungen vom Origin in die lokale Version des Codes (z.B. Änderungen von anderen)
* Branch: Eine unabhängige Version des Codes zur parallelen Entwicklung an verschiedenen Funktionen
* Merge: Zusammenführen von Änderungen (Commits) aus verschiedenen Quellen (z.B. verschiedene Branches)

Workflow: Änderungen vornehmen, Committen mit Kommentar, Pushen und für andere verfügbar machen.

## Lokale Entwicklung
Zur lokalen Entwicklung müssen zunächst (einmalig oder nach Änderungen an der package.json Datei) alle externen packages installiert werden.
```
yarn install
```
Anschließend kann ein lokaler Entwicklungsserver mit folgendem Befehl gestartet werden. Bei Code Änderungen wird die Vorschau automatisch aktualisiert (hot-reloading).
Die zu öffnende lokale Webseite wird im Terminal / in der Konsole ausgegeben.
```
yarn serve
```

## Veröffentlichung des Codes
Zur Veröffentlichung einer neuen version des Codes muss zunächst ein sogenannter `production build` durchgeführt werden. Führe dazu folgendes im Terminal aus.
```
yarn build
```
Anschließend kann der Inhalt des `dist` Ordners bei einem beliebigen Webhosting service hochgeladen werden.  
Für gesonderte Anforderungen, wie Anpassungen des Basepaths: Siehe [Configuration Reference](https://cli.vuejs.org/config/).
Vorgehen zur Veröffentlichung auf dem Produktionssysteme Server des WZL:
1. `yarn build`
2. `dist` ordner als zip komprimieren
3. zip Datei an den Ansprechpartner für die IT der Produktionssysteme Server des WZL senden.  
   Aktueller Ansprechpartner: **Andreas Rudolf** (A.Rudolf@wzl.rwth-aachen.de)
2. Nach dem Upload kann unter folgenden Link auf die Simulation zugegriffen werden:  
   https://www.produktionssysteme.rwth-aachen.de/agile-montage/

## Struktur des Codes
Der Code zur Logik und Steuerung der Simulation strukturiert sich in die folgenden Module: 

### Simulation.ts
Die Simulation ist für die Erzeugung einer virtuellen Zeit-Umgebung verantwortlich.
Sie verfügt u.a. über die Methoden `startSimulation` und `stopSimulation` und zählt die Simulationszeit in einer einstellbaren Geschwindigkeit hoch.  
Da die Simulation die Kontrolle über die Zeit hat, ist die auch dafür verantwortlich zeitdiskrete Events auszuführen. Hierzu können andere Module des Codes diskrete Events bei der Simulation registrieren via `scheduleEvent`, wobei eine Zeit, ein Name und eine Payload übergeben werden kann.
Wenn die Zeit des Events erreicht wird, wird das Event durch die Simulation an alle anderen Module zurückgespielt bzw. veröffentlicht. Diese haben nun die Möglichkeit über den zentralen `EventBus` auf das Event zu hören und eigenen Code auszuführen, wenn das Event gefeuert wird.

### Manager.ts
Der Manager ist das zentrale Element zur Steuerung der Montage. Der Manager wird zusammen mit der Simulation instanziiert, um soe direkt auf diese zugreifen zu können.
Zudem werden alle Montagestationen und Aufträge bei dem Manager registriert.  
Durch die Methode `addJob` wird ein Auftrag in die Warteschlange hinzugefügt. Durch `dispatchJob` wird dieser in die Montageumgebung freigegeben.  
Darüber hinaus ist der Manager dafür zuständig die Dispatching-Strategie bzw. Auftragsfreigabe zu koordinieren und dient als Schnittstelle zwischen anderen Modulen und der Simulation.

### AssemblyStation.ts
Die AssemblyStation repräsentiert eine Station im Montagesystem. Die agiert als eigenständiger Agent mit Multiagentensystem, welches durch den Manager als zentralen Agenten koordiniert wird.
Jede Station verwaltet eigenständig eine Warteliste an Jobs und eine Liste an Jobs, die sich auf dem Weg zur Station befinden. Zudem wird der aktuelle Status, aktive Auftrag und die verbleibende Bearbeitungszeit gespeichert.  
Ein aktiver Auftrag (`activeJobOperation`) setzt sich stets aus einem `job` und einer `operation` zusammen, da ein Job mehrere Operationen an einer einzelnen Station durchführen könnte.  
Die Interaktion der Station mit anderen Agenten erfolgt über diskrete Events. Alle relevanten Events werden in der Methode `startEventListeners` beobachtet. Wenn eines der Events durch welche die Simulation und den EventBus gefeuert wird, muss zunächst über die `id` in der payload geprüft werden, ob das Event für die aktuelle Station relevant ist.
Ist die relevanz geprüft, können anschließend weitere Aktionen als Folge des Events ausgeführt werden.  
**Beispiel:**
```ts
// job arrived at station
EventBus.$on(JobEventType.ARRIVED, (payload: JobEventPayload) => {
    if (payload.station.id === this.id) {
        this.handleJobArrival(payload.jobOperation).then()
    }
})
```
Darüber hinaus können Events an andere Agenten über Events publiziert werden, z.B.
```ts
this.manager.dispatchEvent(StationEventType.STATION_DISABLED, {
    station: this
})
```
Diskrete Events können ebenfalls zu einem späteren Zeitpunkt verarbeitet werden, durch die `scheduleEvent` methode des managers:
```ts
this.manager.simulation.scheduleEvent({
    name: StationEventType.PROCESSING_COMPLETED,
    payload: payload,
    availableAt: this.expectedFinishTime,
    sender: this
})
```
Ein weiteres zentrales Element der AssemblyStation ist die Methode `evaluateQueue`, in welcher der "beste" Job aus der Warteschlange zur Bearbeitung ausgewählt wird.
Hierbei ist der geplante Lieferzeitpunkt des Auftrags ausschlaggebend. Die Logik kann in der Methode `getScoreForJobOperation` des `AssemblyJob`s erweitert werden.

### AssemblyJob.ts
Ein AssemblyJob repräsentiert einen Auftrag im Montagesystem. Jeder Auftrag muss beim `Manager` einmalig registriert und dispatched bzw. freigegeben werden, um die Bearbeitung zu starten.
Freigegebene Aufträge bewegen sich anschließend eigenständig durch das Montagesystem und kommunizieren über Events mit den Montagestationen und dem Manager.  
Jeder Auftrag verwaltet eigenständig die auszuführenden und abgeschlossenen Montageoperationen und evaluiert auf dieser Basis den "besten" Pfad durch das Montagesystem.
Analog zur Montagestation müssen auch hier alle `eventListener` in der Methode `startEventListeners` registriert werden.  
**Beispiel:**
```ts
// listen to queued event
EventBus.$on(StationEventType.JOB_QUEUED, (payload: JobEventPayload) => {
    if (payload.jobOperation.job.id === this.id) {
        this.setQueued()
    }
})
```
Die wichtigste Steuerungslogik zur Routenplanung eines Auftrages findet sich in den Methoden `prepareNextOperation` und `findNextStation`. Hier wird durch Evaluation von Station-Scores entschieden,
welche Operationen auf welcher Station als nächstes Bearbeitet werden soll. Hierbei werden folgende Parameter mit einbezogen:
* Erlaubte Operationen anhand der Vorrangbeziehungen
* Verfügbarkeit von Stationen (Defekte o.ä.)
* Fähigkeit von Stationen eine angefragte Operation durchzuführen (anhand der Module)
* Transportzeit bzw. Distanz zur Station
* Maximale Wartezeit durch bereits wartende Auftrage oder sich auf dem Weg befindliche Aufträge zur selben Station

Neben der Entscheidungslogik führt der AssemblyJob eine animierte Bewegung des Weges zwischen zwei Stationen aus, welche durch die asynchrone Methode `moveTo` gesteuert wird.

### Router.ts
Das Router-Modul hilft dem AssemblyJob einen gültigen Pfad durch das Grid System der Montage zu finden. Hierbei wird ein Pfad vor der Bewegung berechnet, welcher den Job möglichst effizient ans Ziel bringt
unter Vernachlässigung von anderen Jobs, welche sich gleichzeitig bewegen.

### Dispatcher.ts
Es können verschiedenen Auftragsfreigabe-Strategien implementiert werden. Jede Dispatcher Klasse, welche das `DispatcherInterface` implementiert stellt eine solche Strategie dar.
Innerhalb des Dispatcher kann auf die Fertigstellung eines anderen Auftrages oder das voranschreiten der Zeit durch eigene Logik reagiert werden, um darauf aufbauend einen neuen Auftrag freizugeben.
Der aktive Dispatcher wird auf der Manager durch z.B. `manager.dispatcher = new PullDispatcher()` festgelegt.

### Reader.ts
Ein Excel-Datei-Reader wird eine hochgeladene Konfigurationsdatei parsen um die Agenten zu erkennen und diese im Code herzustellen. 

### Others
#### Product, Operation
Als Typdefinitionen dienen Product, Operation, um die Daten zu strukturieren.

## Views und Visual Components
Für die visuelle Darstellung und das data-binding wird in diesem Projekt das Framework Vue (https://vuejs.org/) verwendet. Zur vollständigen Typisierung wird des Codes, wird dabei die class-component syntax (https://vuejs.org/v2/guide/typescript.html#Class-Style-Vue-Components) verwendet.  
Das Interface der App wird über die zentrale `App.vue` component und den `vue-router` gesteuert. Jede Ansicht (view) ist in einer separaten Component definiert. Zentral ist hierbei die view `Simulation.vue`, in welcher die Simulation visualisiert wird.  
Für die Darstellung der Simulation wird ein HTML Canvas mit dem Konva Framework (https://konvajs.org/) genutzt.

### KonvaStation.vue
Die Component KonvaStation ist die visuelle Repräsentation eine Montagestation als Konva Element. Konva ist dabei ein framework zum Arbeiten mit HTML Canvas.
D.h. dass die gesamte Simulation innerhalb eines Canvas Elements gerendert wird und Konva das data-binding zu den Elementen innerhalb des Canvas ermöglicht.
### KonvaVehicle.vue
Analog zur KonvaStation ist KonvaVehicle die visuelle Repräsentation eines Montageauftrages. Ein Auftrag kann dabei durch verschiedene icons dargestellt werden, wobei das aktive icon zentral über die Simulation festgelegt werden kann.

## Analytics
In dieser Ansicht werden echtzeit Rechnungen von verschiedenen Werten der Jobs visuell dargestellt, wie z.B. das Verhältnis zwischen der Wartezeit, der Transportzeit, und der Bearbeitungszeit aller Jobs insgesamt. 

## Data Table
In dieser Ansicht werden die Agenten (Module, Stationen, Operationen und Produkte) angezeigt und können von der User bearbeitet werden. Die User-Änderungen werden in der Simulation Ansicht übertragen. In der gleichen Art, Änderungen in der Simulation Ansicht wie z.B. das Verschieben von Stationen (durch Drag and Drop) werden in der Products Beta Ansicht übernommen, in dem Beispiel werden die neuen Koordinaten der Stationen dargestellt.
Eine Excel-Datei dient zur Konfiguration der Agenten außerhalb des Demonstrators. Musterkonfigurationsdateien können heruntergeladen werden, ausgefüllt, und danach in der Products Ansicht hochgeladen. Die Methode der Ausfüllung der Excel-Datei ist im Blatt "Readme" erklärt.   

## Bibliotheken
Vue Bootstrap (https://bootstrap-vue.org/) ist die verwendete Bibliothek für eine einheitliche Darstellung der UI-Komponenten. 
Vuex ist benutzt um bestimmte Eigenschaften der Agenten von der Zeitpunkt deren Erstellung unveränderbar zu bewahren z.B. für die  Wiederherstelleung dieser Agenten wenn diese von User zurückgesetzt werden.  
Wenn bestimmte JavaScript Bibliotheken nicht direkt von TypeScript akzeptiert sind, müssen diese in der index.d.ts Datei deklariert werden.

## Debugging
Zum Debuggen können die Developer Tools benutzt - insbesonders die Console und die Vue Extension (Vue.js devtool für Chrome), wo der Status der Vue Componenten während der Simulation ausführlich dargestellt ist.