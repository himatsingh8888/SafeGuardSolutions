import './AdminInventory.css'
import React from 'react'
import { API_BASE } from '../../config/apiBase.js'

export default function AdminInventory() {
    const [inventory, setInventory] = React.useState([])
    const [showModal, setShowModal] = React.useState(false)
    const [refresh, setRefresh] = React.useState(0)
    const [modalMode, setModalMode] = React.useState(null)
    const [selectedItem, setSelectedItem] = React.useState(null)

    const inventoryList = inventory.map((item) => {
        const stockStatus = getStockStatus(item.quantity)
        return (
            <div key={item.inventoryid} className='inventory-row'>
                <h4>{item.itemtype}</h4>
                <div>
                    <p>{item.suppliercompany}</p>
                </div>
                <div>
                    <p className='stock-text'>{item.quantity} units</p>
                    <span className={`stock-badge ${stockStatus.class}`}>{stockStatus.label}</span>
                </div>
                <h2 className='purchase-date'>{formatDate(item.dateofpurchase)}</h2>
                <div className='warranty-cell'>
                    <p className='warranty-text'>{formatDate(item.warranty)}</p>
                </div>
                <div className='action-buttons'>
                    <button onClick={() => {
                        setModalMode('edit')
                        setShowModal(true)
                        setSelectedItem(item)
                    }}>Edit</button>
                    <button onClick={() => { deleteItem(item.inventoryid) }}>Delete</button>
                </div>
            </div>
        )
    })

    function getStockStatus(quantity) {
        if (quantity < 10) {
            return { label: 'Low Stock', class: 'low-stock' }
        } else if (quantity <= 30) {
            return { label: 'Medium', class: 'medium-stock' }
        } else {
            return { label: 'In Stock', class: 'in-stock' }
        }
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        const options = { month: 'short', day: 'numeric', year: 'numeric' }
        return date.toLocaleDateString('en-US', options)
    }

    function formatDateForInput(dateString) {
        if (!dateString) return ''
        const date = new Date(dateString)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    React.useEffect(() => {
        const fetchInventory = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/inventory`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })
                const data = await res.json()
                setInventory(data)
            } catch (error) {
                console.error(error)
            }
        }

        fetchInventory()
    }, [refresh])

    async function handleFormSubmit(e) {
        e.preventDefault()
        const formData = new FormData(e.target)

        const itemType = formData.get("itemType")
        const supplierCompany = formData.get("supplierCompany")
        const quantity = formData.get("quantity")
        const dateOfPurchase = formData.get("dateOfPurchase")
        const warranty = formData.get("warranty")

        try {
            const res = await fetch(`${API_BASE}/api/admin/addInventory`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ itemType, supplierCompany, quantity, dateOfPurchase, warranty })
            })

            const data = await res.json()

            if (res.ok) {
                console.log('Item successfully added')
                setRefresh(prev => prev + 1)
                setShowModal(false)
            } else {
                console.log(data.message)
            }
        } catch (error) {
            console.error(error)
        }
    }

    async function deleteItem(inventoryid) {
        try {
            const res = await fetch(`${API_BASE}/api/admin/deleteInventory`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ inventoryid })
            })
            const data = await res.json()

            if (res.ok) {
                console.log(data.message)
                setRefresh(prev => prev + 1)
            }
        } catch (error) {
            console.log(error)
        }
    }

    async function updateItem(e) {
        e.preventDefault()
        const formData = new FormData(e.target)

        const itemType = formData.get("itemType")
        const supplierCompany = formData.get("supplierCompany")
        const quantity = formData.get("quantity")
        const dateOfPurchase = formData.get("dateOfPurchase")
        const warranty = formData.get("warranty")
        const inventoryid = selectedItem.inventoryid

        try {
            const res = await fetch(`${API_BASE}/api/admin/updateInventory`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ itemType, supplierCompany, quantity, dateOfPurchase, warranty, inventoryid })
            })
            const data = await res.json()

            if (res.ok) {
                console.log(data.message)
                setRefresh(prev => prev + 1)
                setShowModal(false)
            }
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div>
            {showModal &&
                <div className='overlay'>
                    <div className='modal'>
                        <div className='modal-header'>
                            <h1>{modalMode === 'edit' ? 'Edit Item' : 'Add Item'}</h1>
                            <button onClick={() => { setShowModal(false) }}>x</button>
                        </div>
                        <form onSubmit={modalMode === 'edit' ? updateItem : handleFormSubmit}>
                            <div className='field-row'>
                                <div>
                                    <p className='field-label'>ITEM TYPE</p>
                                    <input type="text" name="itemType" placeholder="eg. Security Camera" defaultValue={modalMode === 'edit' ? selectedItem?.itemtype : ''} required />
                                </div>
                                <div>
                                    <p className='field-label'>SUPPLIER</p>
                                    <input type="text" name="supplierCompany" placeholder="eg. TechCorp" defaultValue={modalMode === 'edit' ? selectedItem?.suppliercompany : ''} required />
                                </div>
                            </div>
                            <div className='field-row'>
                                <div>
                                    <p className='field-label'>QUANTITY</p>
                                    <input type="number" name="quantity" placeholder="eg. 20" defaultValue={modalMode === 'edit' ? selectedItem?.quantity : ''} required />
                                </div>
                                <div>
                                    <p className='field-label'>PURCHASE DATE</p>
                                    <input type="date" name="dateOfPurchase" defaultValue={modalMode === 'edit' ? formatDateForInput(selectedItem?.dateofpurchase) : ''} required />
                                </div>
                            </div>
                            <p className='field-label'>WARRANTY EXPIRY</p>
                            <input className='full-width-input' type="date" name="warranty" defaultValue={modalMode === 'edit' ? formatDateForInput(selectedItem?.warranty) : ''} />
                            <div className='modal-footer'>
                                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit">{modalMode === 'edit' ? 'Edit Item' : 'Add Item'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            }
            <div className="Admin-Dashboard" style={{ padding: 24 }}>

                <div className="page-header">
                    <div className='header-title'>
                        <h2>Inventory</h2>
                        <p>Manage your equipment and stock</p>
                    </div>
                    <button onClick={() => { setShowModal(true); setModalMode('add') }}>+Add Item</button>
                </div>
                <div className='Inventory-Table'>
                    <div className='Inventory-Header'>
                        <h4>ITEM</h4>
                        <h4>SUPPLIER</h4>
                        <h4>STOCK</h4>
                        <h4>PURCHASE DATE</h4>
                        <h4>WARRANTY</h4>
                        <h4>ACTIONS</h4>
                    </div>
                    {inventoryList}
                </div>

            </div>
        </div>
    );
}