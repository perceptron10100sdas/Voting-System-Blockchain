import { html, render } from 'lit-html';
import { exam_backend } from 'declarations/exam_backend';
import logo from './logo2.svg';

class App {
  proposals = [];
  newProposal = { description: '', is_active: false };
  selectedProposal = null;
  voteType = null;

  constructor() {
    console.log('App constructor called');
    this.#fetchProposals();
    this.#render();
  }

  #fetchProposals = async () => {
    try {
      const proposalsArray = await exam_backend.get_all_proposals();
      this.proposals = proposalsArray.map(([id, proposal]) => ({
        id,
        ...proposal
      }));
      console.log('Fetched proposals:', this.proposals);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    }
  
    this.#render();
  };

  #handleCreateProposal = async (e) => {
    e.preventDefault();
    const result = await exam_backend.create_proposal(BigInt(this.proposals.length), this.newProposal);
    if (result) {
      await this.#fetchProposals();
      this.newProposal = { description: '', is_active: false };
    } else {
      alert('Failed to create proposal');
    }
    this.#render();
  };

  #handleEditProposal = async (e) => {
    e.preventDefault();
    const result = await exam_backend.edit_proposal(BigInt(this.selectedProposal), this.newProposal);
    if (result.Ok) {
      await this.#fetchProposals();
      this.selectedProposal = null;
      this.newProposal = { description: '', is_active: false };
    } else {
      alert(`Failed to edit proposal: ${Object.keys(result.Err)[0]}`);
    }
    this.#render();
  };

  #handleVote = async (voteType) => {
    const result = await exam_backend.vote(BigInt(this.selectedProposal), { [voteType]: null });
    if (result.Ok) {
      await this.#fetchProposals();
      this.voteType = null;
    } else {
      alert(`Vote failed: ${Object.keys(result.Err)[0]}`);
    }
    this.#render();
  };

  #handleEndProposal = async () => {
    const result = await exam_backend.end_proposal(BigInt(this.selectedProposal));
    if (result.Ok) {
      await this.#fetchProposals();
      this.selectedProposal = null;
    } else {
      alert(`Failed to end proposal: ${Object.keys(result.Err)[0]}`);
    }
    this.#render();
  };

  #render() {
    console.log('App #render method called');
    if (!this.proposals || this.proposals.length === 0) {
      return html`<p>No proposals available at the moment.</p>`;
    }
    const body = html`
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        img {
          max-width: 200px;
          margin-bottom: 20px;
        }
        form {
          margin-bottom: 20px;
        }
        input[type="text"] {
          width: 60%;
          padding: 8px;
          margin-right: 10px;
        }
        button {
          padding: 8px 16px;
          background-color: #0057b7;
          color: white;
          border: none;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        button:hover {
          background-color: #003d82;
        }
        .proposal {
          background-color: #f4f4f4;
          padding: 15px;
          margin-bottom: 15px;
          border-radius: 5px;
        }
        .proposal h3 {
          margin-top: 0;
        }
        .vote-buttons {
          margin-top: 10px;
        }
        .vote-buttons button {
          margin-right: 10px;
        }
      </style>
      <main>
        <img src="${logo}" alt="DFINITY logo" />
        <form @submit=${this.#handleCreateProposal}>
          <label for="name">Create Proposal: &nbsp;</label>
          <input
            id="name"
            alt="Description"
            type="text"
            .value=${this.newProposal.description}
            @input=${(e) => (this.newProposal.description = e.target.value)}
          />
          <label>
            <input
              type="checkbox"
              ?checked=${this.newProposal.is_active}
              @change=${(e) => (this.newProposal.is_active = e.target.checked)}
            />
            Active
          </label>
          <button type="submit">Create</button>
        </form>

        <section>
          <h2>Proposals</h2>
          ${this.proposals.map(
            (proposal, index) => html`
              <div class="proposal">
                <h3>${proposal.description}</h3>
                <p>
                  Approve: ${proposal.approve}, Reject: ${proposal.reject}, Pass: ${proposal.pass}
                </p>
                <p>Active: ${proposal.is_active ? 'Yes' : 'No'}</p>
                <p>Voted: ${proposal.voted.length}</p>
                <p>Owner: ${proposal.owner.toText()}</p>
                <button @click=${() => (this.selectedProposal = index)}>Edit</button>
                ${this.selectedProposal === index
                  ? html`
                      <form @submit=${this.#handleEditProposal}>
                        <input
                          .value=${this.newProposal.description}
                          @input=${(e) => (this.newProposal.description = e.target.value)}
                        />
                        <label>
                          <input
                            type="checkbox"
                            ?checked=${this.newProposal.is_active}
                            @change=${(e) => (this.newProposal.is_active = e.target.checked)}
                          />
                          Active
                        </label>
                        <button type="submit">Save</button>
                        <button @click=${() => (this.selectedProposal = null)}>Cancel</button>
                        <div class="vote-buttons">
                          <button @click=${() => this.#handleVote('Approve')}>Approve</button>
                          <button @click=${() => this.#handleVote('Reject')}>Reject</button>
                          <button @click=${() => this.#handleVote('Pass')}>Pass</button>
                          <button @click=${this.#handleEndProposal}>End Proposal</button>
                        </div>
                      </form>
                    `
                  : ''}
              </div>
            `
          )}
        </section>
      </main>
    `;
    render(body, document.getElementById('root'));
  }
}

export default App;
