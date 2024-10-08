import React, { useState, useEffect, useMemo, useContext } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import SideBar from '../../components/sidebar/SideBar';
import TopBar from '../../components/sidenav/TopNav';
import { saveAs } from 'file-saver';
import { UserPermissionsContext } from '../context/UserPermissionsPage'; // Fixed import
import "../../style/viewsStyle/invoicesStyles.css"
function InvoicesDetails() {
    const { id } = useParams();
    const [factureData, setFactureData] = useState({});
    const [customers, setCustomers] = useState([]);
    const role = localStorage.getItem('role');
    const token = localStorage.getItem("token");

    const isAdmin = role === 'admin';
    const userPermissions = useContext(UserPermissionsContext);

    const config = useMemo(() => ({
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }), [token]);

    const createAndDownloadPdf = () => {
        axios.post('http://127.0.0.1:4000/api/createPDFInvoice', { factureData, customers })
            .then((response) => {
                const { filePath } = response.data;
                if (!filePath) throw new Error("File path is missing in the response");
                
                return axios.get('http://127.0.0.1:4000/api/fetchPDFInvoice', {
                    params: { filePath },
                    responseType: 'blob',
                });
            })
            .then((res) => {
                const pdfBlob = new Blob([res.data], { type: 'application/pdf' });
                saveAs(pdfBlob, 'invoice.pdf');
            })
            .catch((error) => {
                console.error("Error downloading PDF:", error);
                alert("Failed to download the invoice. Please try again later.");
            });
    };

    useEffect(() => {
        const fetchInvoiceAndCustomerData = async () => {
            try {
                const [invoiceResponse, customerResponse] = await Promise.all([
                    axios.get(`http://127.0.0.1:4000/api/getInvoiceDetailsByCommandId/${id}`, config),
                    axios.get(`http://127.0.0.1:4000/api/getCustomerByIDCommand/${id}`, config),
                ]);
                setFactureData(invoiceResponse.data.InvoiceDetailsByCommandId[0]);
                setCustomers(customerResponse.data);
            } catch (err) {
                console.error("Error fetching data:", err);
            }
        };

        fetchInvoiceAndCustomerData();
    }, [id, config]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFactureData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const createInvoice = async (event) => {
        event.preventDefault();
        try {
            await axios.put("http://127.0.0.1:4000/api/createInvoice", {
                date_facture: factureData.date_facture,
                etat_facture: factureData.etat_facture,
                statut_paiement_facture: factureData.statut_paiement_facture,
                methode_paiment_facture: factureData.methode_paiment_facture,
                date_echeance: factureData.date_echeance,
                idcommande: id
            }, config);
            alert("Invoice updated successfully.");
        } catch (error) {
            console.error("Error updating invoice status:", error);
        }
    };

    return (
        <div className="d-flex">
            <SideBar />
            <div className="container-fluid flex-column">
                <TopBar />
                <div className="container-fluid p-2">
                    {factureData && (
                        <div className="d-flex flex-wrap" id="invoice-details">
                            <div className="invoice-section mr-4">
                                <h2>Command {factureData.description_commande}</h2>
                                <p>
                                    <span>ID</span>: {factureData.idcommande}<br />
                                    <span>Date</span>: {factureData.date_commande}<br />
                                    <span>Total Amount</span>: {factureData.montant_total_commande}<br />
                                    <span>Address</span>: {factureData.adresselivraison_commande}<br />
                                   <span> Payment Method</span>: {factureData.modepaiement_commande}<br />
                                    <span>Status</span>: {factureData.statut_commande}<br />
                                    <span>Delivery Date</span>: {factureData.date_livraison_commande}<br />
                                    <span>Delivery Method</span>: {factureData.metho_delivraison_commande}
                                </p>
                                <div className="customer-section">
                                    <h2>Customer Information</h2>
                                    {customers.map((customer, key) => (
                                        <p key={key}>
                                            <span>ID</span>: {customer.idclient}<br />
                                            <span>Name</span>: {customer.nom_client} {customer.prenom_client}<br />
                                            <span>Phone</span>: {customer.telephone_client}<br />
                                            <span>Address</span>: {customer.adresse_client}<br />
                                            <span>Email</span>: {customer.email_client}<br />
                                            <span>Genre</span>: {customer.genre_client}<br />
                                            <span>Date of Birth</span>: {customer.datede_naissance_client}
                                        </p>
                                    ))}
                                </div>
                            </div>
                            {role !== 'client' ? (
                                <form className="invoice-form" onSubmit={createInvoice}>
                                    <div className="row">
                                        <div className="form-group">
                                            <label htmlFor="idfacture">Invoice ID:</label>
                                            <span className="form-control">{factureData.idfacture}</span>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="date_facture">Invoice Date:</label>
                                            <span className="form-control">{factureData.date_facture}</span>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="etat_facture">Invoice Status:</label>
                                            <select
                                                className="form-control"
                                                id="etat_facture"
                                                name="etat_facture"
                                                value={factureData.etat_facture || ""}
                                                onChange={handleInputChange}
                                            >
                                                <option value="enAttente">En Attente</option>
                                                <option value="payee">Payée</option>
                                                <option value="enRetard">En Retard</option>
                                                <option value="annulee">Annulée</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="methode_paiment_facture">Payment Method:</label>
                                            <select
                                                className="form-control"
                                                id="methode_paiment_facture"
                                                name="methode_paiment_facture"
                                                value={factureData.methode_paiment_facture || ""}
                                                onChange={handleInputChange}
                                            >
                                                <option value="Carte de crédit">Carte de crédit</option>
                                                <option value="Virement bancaire">Virement bancaire</option>
                                                <option value="Autre">Autre</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="date_echeance">Due Date:</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                id="date_echeance"
                                                name="date_echeance"
                                                value={factureData.date_echeance || ""}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="statut_paiement_facture">Payment Status:</label>
                                            <select
                                                className="form-control"
                                                id="statut_paiement_facture"
                                                name="statut_paiement_facture"
                                                value={factureData.statut_paiement_facture || ""}
                                                onChange={handleInputChange}
                                            >
                                                <option value="paye">Payé</option>
                                                <option value="non_paye">Non Payé</option>
                                            </select>
                                        </div>
                                        {(isAdmin || userPermissions?.updateFacture === 1) && (
                                            <button type="submit" className="btn btn-primary mr-2">
                                                Create Invoice
                                            </button>
                                        )}
                                        <button type="button" className="btn btn-success" onClick={createAndDownloadPdf}>
                                            Download Invoice PDF
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div>
                                    <h2>Invoice Details</h2>
                                    <p>
                                        ID: {factureData.idfacture}<br />
                                        Date: {factureData.date_facture}<br />
                                        Status: {factureData.etat_facture}<br />
                                        Total Amount: {factureData.montant_total_facture}<br />
                                        Payment Method: {factureData.methode_paiment_facture}<br />
                                        Due Date: {factureData.date_echeance}<br />
                                        Payment Status: {factureData.statut_paiement_facture}<br />
                                    </p>
                                    <button type="button" className="btn btn-success" onClick={createAndDownloadPdf}>
                                        Download Invoice PDF
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default InvoicesDetails;
