import './adminShared.css'
import './AdminInventory.css'
import React from 'react'
import { API_BASE } from '../../config/apiBase.js'

function stockBadge(quantity) {
  if (quantity < 10) return { label: 'Low', className: 'clients-badge low-stock' }
  if (quantity <= 30) return { label: 'Medium', className: 'clients-badge medium-stock' }
  return { label: 'In stock', className: 'clients-badge in-stock' }
}

export default function AdminInventory() {
  const [inventory, setInventory] = React.useState([])
  const [showModal, setShowModal] = React.useState(false)
  const [refresh, setRefresh] = React.useState(0)
  const [modalMode, setModalMode] = React.useState(null)
  const [selectedItem, setSelectedItem] = React.useState(null)

  React.useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/inventory`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })
        const data = await res.json()
        setInventory(data)
      } catch (error) {
        console.error(error)
      }
    }
    fetchInventory()
  }, [refresh])

  function formatDate(dateString) {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function formatDateForInput(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  async function handleFormSubmit(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const itemType = formData.get('itemType')
    const supplierCompany = formData.get('supplierCompany')
    const quantity = formData.get('quantity')
    const dateOfPurchase = formData.get('dateOfPurchase')
    const warranty = formData.get('warranty')
    try {
      const res = await fetch(`${API_BASE}/api/admin/addInventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ itemType, supplierCompany, quantity, dateOfPurchase, warranty }),
      })
      if (res.ok) {
        setRefresh(prev => prev + 1)
        setShowModal(false)
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
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ inventoryid }),
      })
      if (res.ok) setRefresh(prev => prev + 1)
    } catch (error) {
      console.log(error)
    }
  }

  async function updateItem(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const itemType = formData.get('itemType')
    const supplierCompany = formData.get('supplierCompany')
    const quantity = formData.get('quantity')
    const dateOfPurchase = formData.get('dateOfPurchase')
    const warranty = formData.get('warranty')
    const inventoryid = selectedItem.inventoryid
    try {
      const res = await fetch(`${API_BASE}/api/admin/updateInventory`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ itemType, supplierCompany, quantity, dateOfPurchase, warranty, inventoryid }),
      })
      if (res.ok) {
        setRefresh(prev => prev + 1)
        setShowModal(false)
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="clients-page">
      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'edit' ? 'Edit item' : 'Add item'}</h2>
              <button type="button" className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={modalMode === 'edit' ? updateItem : handleFormSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Item type</label>
                    <input className="form-input" type="text" name="itemType" placeholder="Security camera" defaultValue={modalMode === 'edit' ? selectedItem?.itemtype : ''} required />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Supplier</label>
                    <input className="form-input" type="text" name="supplierCompany" placeholder="Supplier name" defaultValue={modalMode === 'edit' ? selectedItem?.suppliercompany : ''} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Quantity</label>
                    <input className="form-input" type="number" name="quantity" min="0" placeholder="20" defaultValue={modalMode === 'edit' ? selectedItem?.quantity : ''} required />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Purchase date</label>
                    <input className="form-input" type="date" name="dateOfPurchase" defaultValue={modalMode === 'edit' ? formatDateForInput(selectedItem?.dateofpurchase) : ''} required />
                  </div>
                </div>
                <div className="form-field full">
                  <label className="form-label">Warranty expiry</label>
                  <input className="form-input" type="date" name="warranty" defaultValue={modalMode === 'edit' ? formatDateForInput(selectedItem?.warranty) : ''} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="clients-btn-edit" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="clients-btn-primary">{modalMode === 'edit' ? 'Save' : 'Add item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="clients-main">
        <div className="clients-page-header">
          <div>
            <h1 className="clients-page-title">Inventory</h1>
            <p className="clients-page-sub">Equipment and stock on hand</p>
          </div>
          <button
            type="button"
            className="clients-add-btn"
            onClick={() => { setModalMode('add'); setSelectedItem(null); setShowModal(true); }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add item
          </button>
        </div>

        {inventory.length === 0 ? (
          <div className="clients-empty">No inventory records yet.</div>
        ) : (
          <>
            <div className="adm-table-scroll">
              <div className="adm-table-wrap">
                <table className="adm-table inventory-admin-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Supplier</th>
                      <th>Stock</th>
                      <th>Purchased</th>
                      <th>Warranty</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map(item => {
                      const st = stockBadge(item.quantity)
                      return (
                        <tr key={item.inventoryid}>
                          <td style={{ fontWeight: 500 }}>{item.itemtype}</td>
                          <td>{item.suppliercompany}</td>
                          <td>
                            <span style={{ marginRight: 8 }}>{item.quantity} units</span>
                            <span className={st.className}>{st.label}</span>
                          </td>
                          <td>{formatDate(item.dateofpurchase)}</td>
                          <td>{formatDate(item.warranty)}</td>
                          <td>
                            <button
                              type="button"
                              className="clients-btn-edit"
                              onClick={() => { setModalMode('edit'); setSelectedItem(item); setShowModal(true); }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="clients-btn-delete"
                              style={{ marginLeft: 6 }}
                              onClick={() => deleteItem(item.inventoryid)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="clients-footer">{inventory.length} items</div>
          </>
        )}
      </div>
    </div>
  )
}
