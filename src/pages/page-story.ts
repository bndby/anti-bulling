import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '@/components/app-nav';
import type { JourneyNode } from '@/models/types';
import { pageLayoutStyles } from '@/styles/page-layout';
import { navigate, setTrainingLaunch } from '@/services/navigation';
import { getJourney, getScenariosForNode } from '@/services/scenario-loader';
import { getProgress, getScenarioState, getSettings, saveScenarioState } from '@/storage/db';

@customElement('page-story')
export class PageStory extends LitElement {
  @state() private nodes: JourneyNode[] = [];
  @state() private unlocked = new Set<string>();
  @state() private current = 'first-day';

  static styles = [pageLayoutStyles, css`
    .path {
      display: grid;
      gap: 0.65rem;
    }
    .node {
      text-align: left;
      --mdw-shape__size: var(--radius-md);
      min-height: 78px;
      height: auto;
      width: 100%;
      justify-content: flex-start;
      padding-block: 0.85rem;
      color: var(--color-text);
    }
    .node:disabled,
    .node[disabled] {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .node.current {
      color: var(--color-primary);
    }
    .node h3 {
      margin: 0 0 0.25rem;
      font-family: var(--font-display);
    }
    .node p {
      margin: 0;
      color: var(--color-text-muted);
      font-size: 0.9rem;
    }
  `];

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    this.nodes = getJourney().nodes.sort((a, b) => a.order - b.order);
    const progress = await getProgress();
    const state = await getScenarioState();
    this.unlocked = new Set(progress.unlockedJourneyNodes);
    this.current = state.currentJourneyNodeId;
  }

  private async play(node: JourneyNode) {
    const settings = await getSettings();
    if (!settings.openRouterApiKey.trim()) {
      navigate('/settings');
      return;
    }
    const scenarios = getScenariosForNode(node.id);
    if (!scenarios.length) return;
    const pick = scenarios[Math.floor(Math.random() * scenarios.length)]!;
    const state = await getScenarioState();
    state.currentJourneyNodeId = node.id;
    await saveScenarioState(state);
    setTrainingLaunch({ mode: 'story', scenarioId: pick.id });
    navigate('/training');
  }

  protected render() {
    return html`
      <app-nav title="История"></app-nav>
      <p class="page-sub">Путешествие по школе. Каждый уровень сложнее.</p>
      <div class="path">
        ${this.nodes.map((n) => {
          const open = this.unlocked.has(n.id) || n.id === 'first-day';
          return html`
            <mdw-button
              outlined
              class="node ${n.id === this.current ? 'current' : ''}"
              ?disabled=${!open}
              @click=${() => this.play(n)}
            >
              <span>
                <h3>${n.title}</h3>
                <p>${open ? `${n.scenarioIds.length} сцен` : 'Закрыто'}</p>
              </span>
            </mdw-button>
          `;
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-story': PageStory;
  }
}
