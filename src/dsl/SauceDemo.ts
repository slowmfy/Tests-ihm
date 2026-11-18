import type { Ecran, InfosClient, Produit, Tri, Utilisateur } from './domaine';

/**
 * DSL de test de SauceDemo.
 *
 * Il est exprimé au niveau des TÂCHES de l'utilisateur et des CONCEPTS du domaine
 * (produit, panier, commande...), jamais au niveau des widgets (bouton, champ, sélecteur).
 *
 * - Les ACTIONS modifient l'état du système (ce que l'utilisateur FAIT).
 * - Les PERCEPTIONS vérifient ce que l'utilisateur VOIT ; elles échouent (avec attente
 *   automatique) si la perception attendue n'est pas observée.
 */
export interface SauceDemo {
  // ───────────── ACTIONS ─────────────

  // Tâche « S'authentifier »
  ouvrirLeSite(): Promise<void>;
  seConnecter(utilisateur: Utilisateur | string, motDePasse?: string): Promise<void>;
  seDeconnecter(): Promise<void>;
  /** Saisie directe d'une adresse (contournement de la navigation normale). */
  accederDirectementA(ecran: Ecran): Promise<void>;

  // Tâche « Parcourir le catalogue »
  trierCatalogue(tri: Tri): Promise<void>;
  consulterProduit(produit: Produit): Promise<void>;
  revenirAuCatalogue(): Promise<void>;

  // Tâche « Gérer son panier »
  /** Ajoute le produit depuis l'écran courant (catalogue ou fiche produit). */
  ajouterAuPanier(...produits: Produit[]): Promise<void>;
  /** Retire le produit depuis l'écran courant (catalogue, fiche produit ou panier). */
  retirerDuPanier(...produits: Produit[]): Promise<void>;
  ouvrirLePanier(): Promise<void>;
  continuerMesAchats(): Promise<void>;
  reinitialiserApplication(): Promise<void>;

  // Tâche « Passer commande »
  commencerLaCommande(): Promise<void>;
  renseignerMesInformations(infos: Partial<InfosClient>): Promise<void>;
  annulerLaCommande(): Promise<void>;
  validerLaCommande(): Promise<void>;
  /** Macro-tâche : panier vide -> commande confirmée. */
  acheter(produits: Produit[], infos?: InfosClient): Promise<void>;

  // ───────────── PERCEPTIONS ─────────────

  estSurEcran(ecran: Ecran): Promise<void>;
  voitLErreur(message: string): Promise<void>;
  neVoitAucuneErreur(): Promise<void>;

  /** La pastille du panier indique N (N = 0 : pas de pastille). */
  pastillePanierIndique(n: number): Promise<void>;
  /** Le panier contient exactement ces produits (ordre indifférent). */
  panierContientExactement(produits: Produit[]): Promise<void>;
  /** Le produit est signalé « déjà dans le panier » sur l'écran courant (bouton Remove). */
  produitEstMarqueAjoute(produit: Produit, ajoute?: boolean): Promise<void>;

  catalogueAfficheProduits(n: number): Promise<void>;
  catalogueEstTrie(tri: Tri): Promise<void>;
  /** Le prix affiché (catalogue / fiche / panier) est celui du catalogue de référence. */
  prixAfficheEstCorrect(produit: Produit): Promise<void>;
  ficheAfficheProduit(produit: Produit): Promise<void>;

  /** Sous-total, taxe (8 %) et total du récapitulatif correspondent aux produits. */
  recapitulatifCorrespondA(produits: Produit[]): Promise<void>;
  commandeEstConfirmee(): Promise<void>;
}
