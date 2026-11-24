import { expect, type Locator, type Page } from '@playwright/test';
import type { SauceDemo } from './SauceDemo';
import {
  CATALOGUE,
  CLIENT_TYPE,
  MOT_DE_PASSE_VALIDE,
  montantsAttendus,
  type Ecran,
  type InfosClient,
  type Produit,
  type Tri,
} from './domaine';

/** Correspondance écran du domaine -> chemin technique. */
const CHEMINS: Record<Ecran, string> = {
  connexion: '/',
  catalogue: '/inventory.html',
  'fiche produit': '/inventory-item.html',
  panier: '/cart.html',
  'informations client': '/checkout-step-one.html',
  récapitulatif: '/checkout-step-two.html',
  confirmation: '/checkout-complete.html',
};

const VALEURS_TRI: Record<Tri, string> = {
  'nom A-Z': 'az',
  'nom Z-A': 'za',
  'prix croissant': 'lohi',
  'prix décroissant': 'hilo',
};

const prix = (texte: string) => Number(texte.replace(/[^0-9.]/g, ''));
const dollars = (n: number) => `$${n.toFixed(2)}`;

/**
 * Interpréteur du DSL avec Playwright.
 * C'est le SEUL endroit qui connaît les sélecteurs, les URL et les widgets.
 */
export class PlaywrightSauceDemo implements SauceDemo {
  constructor(private readonly page: Page) {}

  // ───────────── utilitaires (non exposés) ─────────────

  private get badge() {
    return this.page.locator('.shopping_cart_badge');
  }

  private get erreur() {
    return this.page.getByTestId('error');
  }

  /** Conteneur d'un produit sur l'écran courant (carte du catalogue, ligne du panier ou fiche). */
  private conteneur(produit: Produit): Locator {
    if (this.page.url().includes(CHEMINS['fiche produit'])) {
      return this.page.locator('.inventory_details_desc_container');
    }
    return this.page
      .locator('.inventory_item, .cart_item')
      .filter({ has: this.page.locator('.inventory_item_name').getByText(produit, { exact: true }) });
  }

  private async ouvrirMenu() {
    await this.page.getByRole('button', { name: 'Open Menu' }).click();
  }

  // ───────────── ACTIONS ─────────────

  async ouvrirLeSite() {
    await this.page.goto('/');
  }

  async seConnecter(utilisateur: string, motDePasse = MOT_DE_PASSE_VALIDE) {
    if (!this.page.url().startsWith('http')) await this.ouvrirLeSite();
    await this.page.getByTestId('username').fill(utilisateur);
    await this.page.getByTestId('password').fill(motDePasse);
    await this.page.getByTestId('login-button').click();
  }

  async seDeconnecter() {
    await this.ouvrirMenu();
    await this.page.getByTestId('logout-sidebar-link').click();
  }

  async accederDirectementA(ecran: Ecran) {
    const suffixe = ecran === 'fiche produit' ? '?id=4' : '';
    await this.page.goto(CHEMINS[ecran] + suffixe);
  }

  async trierCatalogue(tri: Tri) {
    await this.page.getByTestId('product-sort-container').selectOption(VALEURS_TRI[tri]);
  }

  async consulterProduit(produit: Produit) {
    await this.page.locator('.inventory_item_name').getByText(produit, { exact: true }).click();
  }

  async revenirAuCatalogue() {
    await this.page.getByTestId('back-to-products').click();
  }

  async ajouterAuPanier(...produits: Produit[]) {
    for (const p of produits) {
      await this.conteneur(p).getByRole('button', { name: 'Add to cart' }).click();
    }
  }

  async retirerDuPanier(...produits: Produit[]) {
    for (const p of produits) {
      await this.conteneur(p).getByRole('button', { name: 'Remove' }).click();
    }
  }

  async ouvrirLePanier() {
    await this.page.locator('.shopping_cart_link').click();
  }

  async continuerMesAchats() {
    await this.page.getByTestId('continue-shopping').click();
  }

  async reinitialiserApplication() {
    await this.ouvrirMenu();
    await this.page.getByTestId('reset-sidebar-link').click();
    await this.page.getByRole('button', { name: 'Close Menu' }).click();
  }

  async commencerLaCommande() {
    await this.page.getByTestId('checkout').click();
  }

  async renseignerMesInformations(infos: Partial<InfosClient>) {
    if (infos.prenom !== undefined) await this.page.getByTestId('firstName').fill(infos.prenom);
    if (infos.nom !== undefined) await this.page.getByTestId('lastName').fill(infos.nom);
    if (infos.codePostal !== undefined) await this.page.getByTestId('postalCode').fill(infos.codePostal);
    await this.page.getByTestId('continue').click();
  }

  async annulerLaCommande() {
    await this.page.getByTestId('cancel').click();
  }

  async validerLaCommande() {
    await this.page.getByTestId('finish').click();
  }

  async acheter(produits: Produit[], infos: InfosClient = CLIENT_TYPE) {
    await this.ajouterAuPanier(...produits);
    await this.ouvrirLePanier();
    await this.commencerLaCommande();
    await this.renseignerMesInformations(infos);
    await this.validerLaCommande();
  }

  // ───────────── PERCEPTIONS ─────────────

  async estSurEcran(ecran: Ecran) {
    if (ecran === 'connexion') {
      await expect(this.page.getByTestId('login-button')).toBeVisible();
      return;
    }
    const chemin = CHEMINS[ecran].replace('.', '\\.');
    await expect(this.page).toHaveURL(new RegExp(`${chemin}(\\?.*)?$`));
  }

  async voitLErreur(message: string) {
    await expect(this.erreur).toHaveText(message);
  }

  async neVoitAucuneErreur() {
    await expect(this.erreur).toHaveCount(0);
  }

  async pastillePanierIndique(n: number) {
    if (n === 0) await expect(this.badge).toHaveCount(0);
    else await expect(this.badge).toHaveText(String(n));
  }

  async panierContientExactement(produits: Produit[]) {
    await this.estSurEcran('panier');
    const noms = this.page.locator('.cart_item .inventory_item_name');
    await expect(noms).toHaveCount(produits.length);
    expect((await noms.allTextContents()).sort()).toEqual([...produits].sort());
  }

  async produitEstMarqueAjoute(produit: Produit, ajoute = true) {
    const libelle = ajoute ? 'Remove' : 'Add to cart';
    // Filtre sur le nom : les liens « View details for … » de la carte ont aussi le rôle button.
    const bouton = this.conteneur(produit).getByRole('button', { name: /^(Add to cart|Remove)$/ });
    await expect(bouton).toHaveText(libelle);
  }

  async catalogueAfficheProduits(n: number) {
    await expect(this.page.locator('.inventory_item')).toHaveCount(n);
  }

  async catalogueEstTrie(tri: Tri) {
    await expect(this.page.locator('.inventory_item').first()).toBeVisible();
    if (tri.startsWith('nom')) {
      const noms = await this.page.locator('.inventory_item_name').allTextContents();
      const attendu = [...noms].sort((a, b) => a.localeCompare(b));
      if (tri === 'nom Z-A') attendu.reverse();
      expect(noms, `catalogue trié par ${tri}`).toEqual(attendu);
    } else {
      const valeurs = (await this.page.locator('.inventory_item_price').allTextContents()).map(prix);
      const attendu = [...valeurs].sort((a, b) => (tri === 'prix croissant' ? a - b : b - a));
      expect(valeurs, `catalogue trié par ${tri}`).toEqual(attendu);
    }
  }

  async prixAfficheEstCorrect(produit: Produit) {
    await expect(this.conteneur(produit).locator('.inventory_item_price, .inventory_details_price')).toHaveText(
      dollars(CATALOGUE[produit]),
    );
  }

  async ficheAfficheProduit(produit: Produit) {
    await this.estSurEcran('fiche produit');
    await expect(this.page.locator('.inventory_details_name')).toHaveText(produit);
  }

  async recapitulatifCorrespondA(produits: Produit[]) {
    await this.estSurEcran('récapitulatif');
    const { sousTotal, taxe, total } = montantsAttendus(produits);
    await expect(this.page.getByTestId('subtotal-label')).toHaveText(`Item total: ${dollars(sousTotal)}`);
    await expect(this.page.getByTestId('tax-label')).toHaveText(`Tax: ${dollars(taxe)}`);
    await expect(this.page.getByTestId('total-label')).toHaveText(`Total: ${dollars(total)}`);
  }

  async commandeEstConfirmee() {
    await this.estSurEcran('confirmation');
    await expect(this.page.getByTestId('complete-header')).toHaveText('Thank you for your order!');
  }
}
