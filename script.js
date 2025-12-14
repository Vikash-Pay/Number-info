// DOM Elements
const phoneInput = document.getElementById('phoneInput');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearBtn');
const resultsSection = document.getElementById('resultsSection');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const errorTitle = document.getElementById('errorTitle');
const errorText = document.getElementById('errorText');
const retryBtn = document.getElementById('retryBtn');
const noDataMessage = document.getElementById('noDataMessage');
const noDataText = document.getElementById('noDataText');
const apiDetails = document.getElementById('apiDetails');
const recordsContainer = document.getElementById('recordsContainer');
const jsonView = document.getElementById('jsonView');
const jsonContent = document.getElementById('jsonContent');
const jsonOutput = document.getElementById('jsonOutput');
const toggleJsonBtn = document.getElementById('toggleJsonBtn');
const copyJsonBtn = document.getElementById('copyJsonBtn');
const downloadJsonBtn = document.getElementById('downloadJsonBtn');
const apiStatus = document.getElementById('apiStatus');
const toast = document.getElementById('toast');

// API Configuration
const API_URL = 'https://niloy-number-info-api.vercel.app/api/seller';
const API_KEY = 'Niloy';

// Current search data
let currentData = null;
let currentPhoneNumber = '';

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Input validation
    phoneInput.addEventListener('input', function(e) {
        // Allow only numbers
        this.value = this.value.replace(/\D/g, '');
        
        // Enable/disable search button
        searchBtn.disabled = this.value.length !== 10;
    });
    
    // Search button click
    searchBtn.addEventListener('click', performSearch);
    
    // Enter key in input
    phoneInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.length === 10) {
            performSearch();
        }
    });
    
    // Clear button
    clearBtn.addEventListener('click', clearResults);
    
    // Retry button
    retryBtn.addEventListener('click', () => {
        if (currentPhoneNumber) {
            performSearch(currentPhoneNumber);
        }
    });
    
    // Toggle JSON view
    toggleJsonBtn.addEventListener('click', toggleJsonView);
    
    // Copy JSON button
    copyJsonBtn.addEventListener('click', copyJsonToClipboard);
    
    // Download JSON button
    downloadJsonBtn.addEventListener('click', downloadJsonFile);
});

// Main search function
async function performSearch() {
    const phoneNumber = phoneInput.value.trim();
    
    if (!phoneNumber || phoneNumber.length !== 10) {
        showError('Invalid Input', 'Please enter a valid 10-digit mobile number');
        return;
    }
    
    currentPhoneNumber = phoneNumber;
    
    // Show loading and hide other sections
    showLoading();
    hideError();
    hideNoData();
    hideApiDetails();
    hideJsonView();
    clearRecords();
    
    // Show results section
    resultsSection.style.display = 'block';
    
    try {
        // Make API call
        const response = await fetch(`${API_URL}?key=${API_KEY}&mobile=${phoneNumber}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            timeout: 15000
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        currentData = data;
        
        // Hide loading
        hideLoading();
        
        // Check if data was found
        if (data.success && data.data && data.data.length > 0) {
            // Display the data
            displayApiInfo(data, phoneNumber);
            displayRecords(data.data);
            displayJsonData(data);
            updateApiStatus('success');
            showToast('Data fetched successfully!', 'success');
        } else {
            // No data found
            showNoData(phoneNumber);
            displayJsonData(data);
            updateApiStatus('no-data');
        }
        
    } catch (error) {
        hideLoading();
        
        let errorMsg = 'Failed to fetch data';
        let errorDetail = error.message;
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMsg = 'Network Error';
            errorDetail = 'Please check your internet connection';
        } else if (error.message.includes('timeout')) {
            errorMsg = 'Request Timeout';
            errorDetail = 'The server took too long to respond';
        } else if (error.message.includes('404')) {
            errorMsg = 'API Not Found';
            errorDetail = 'The API endpoint is not available';
        }
        
        showError(errorMsg, errorDetail);
        updateApiStatus('error');
    }
}

// Display API information
function displayApiInfo(data, phoneNumber) {
    apiDetails.style.display = 'block';
    
    document.getElementById('searchNumber').textContent = phoneNumber;
    document.getElementById('dataSource').textContent = data.source || 'N/A';
    document.getElementById('recordsFound').textContent = data.data ? data.data.length : 0;
    document.getElementById('timestamp').textContent = 
        data.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A';
}

// Display records in cards
function displayRecords(records) {
    recordsContainer.innerHTML = '';
    
    records.forEach((record, index) => {
        const recordCard = document.createElement('div');
        recordCard.className = 'record-card';
        
        // Parse address
        const addressParts = record.address ? record.address.split('!') : [];
        
        recordCard.innerHTML = `
            <div class="record-header">
                <h3><i class="fas fa-user"></i> Record ${index + 1}</h3>
                <span class="record-id">ID: ${record.id || 'N/A'}</span>
            </div>
            
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Name</span>
                    <span class="info-value">${record.name || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Father's Name</span>
                    <span class="info-value">${record.father_name || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Primary Mobile</span>
                    <span class="info-value">${record.mobile || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Alternate Mobile</span>
                    <span class="info-value">${record.alt_mobile || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">ID Number</span>
                    <span class="info-value">${record.id_number || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Circle</span>
                    <span class="info-value">${record.circle || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Email</span>
                    <span class="info-value">${record.email || 'N/A'}</span>
                </div>
            </div>
            
            ${addressParts.length > 0 ? `
            <div class="address-section">
                <h4><i class="fas fa-home"></i> Address Details</h4>
                <div class="address-grid">
                    ${addressParts.map((part, i) => `
                        <div class="info-item">
                            <span class="info-label">Part ${i + 1}</span>
                            <span class="info-value">${part || 'N/A'}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        `;
        
        recordsContainer.appendChild(recordCard);
    });
}

// Display JSON data
function displayJsonData(data) {
    jsonView.style.display = 'block';
    jsonOutput.textContent = JSON.stringify(data, null, 2);
    toggleJsonBtn.innerHTML = '<i class="fas fa-eye"></i> Show JSON';
    jsonContent.style.display = 'none';
}

// Toggle JSON view
function toggleJsonView() {
    if (jsonContent.style.display === 'none') {
        jsonContent.style.display = 'block';
        toggleJsonBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide JSON';
    } else {
        jsonContent.style.display = 'none';
        toggleJsonBtn.innerHTML = '<i class="fas fa-eye"></i> Show JSON';
    }
}

// Copy JSON to clipboard
function copyJsonToClipboard() {
    navigator.clipboard.writeText(jsonOutput.textContent)
        .then(() => {
            showToast('JSON copied to clipboard!', 'success');
        })
        .catch(err => {
            showToast('Failed to copy JSON', 'error');
            console.error('Copy failed:', err);
        });
}

// Download JSON as file
function downloadJsonFile() {
    if (!currentData) return;
    
    const dataStr = JSON.stringify(currentData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `phone_info_${currentPhoneNumber}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('JSON file downloaded!', 'success');
}

// Show loading spinner
function showLoading() {
    loading.style.display = 'block';
    searchBtn.disabled = true;
    searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
}

// Hide loading spinner
function hideLoading() {
    loading.style.display = 'none';
    searchBtn.disabled = false;
    searchBtn.innerHTML = '<i class="fas fa-search"></i> Search';
}

// Show error message
function showError(title, message) {
    errorTitle.textContent = title;
    errorText.textContent = message;
    errorMessage.style.display = 'block';
}

// Hide error message
function hideError() {
    errorMessage.style.display = 'none';
}

// Show no data message
function showNoData(phoneNumber) {
    noDataText.textContent = `We couldn't find any information for number: ${phoneNumber}`;
    noDataMessage.style.display = 'block';
}

// Hide no data message
function hideNoData() {
    noDataMessage.style.display = 'none';
}

// Show API details
function showApiDetails() {
    apiDetails.style.display = 'block';
}

// Hide API details
function hideApiDetails() {
    apiDetails.style.display = 'none';
}

// Show JSON view
function showJsonView() {
    jsonView.style.display = 'block';
}

// Hide JSON view
function hideJsonView() {
    jsonView.style.display = 'none';
}

// Clear records container
function clearRecords() {
    recordsContainer.innerHTML = '';
}

// Clear all results
function clearResults() {
    resultsSection.style.display = 'none';
    phoneInput.value = '';
    searchBtn.disabled = true;
    currentData = null;
    currentPhoneNumber = '';
    updateApiStatus('ready');
}

// Update API status indicator
function updateApiStatus(status) {
    const statusIcon = apiStatus.querySelector('i');
    
    switch(status) {
        case 'ready':
            apiStatus.innerHTML = '<i class="fas fa-circle" style="color: #4caf50"></i> API Ready';
            break;
        case 'success':
            apiStatus.innerHTML = '<i class="fas fa-circle" style="color: #4caf50"></i> Data Fetched';
            break;
        case 'no-data':
            apiStatus.innerHTML = '<i class="fas fa-circle" style="color: #ffa502"></i> No Data Found';
            break;
        case 'error':
            apiStatus.innerHTML = '<i class="fas fa-circle" style="color: #ff4757"></i> API Error';
            break;
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = 'toast';
    
    // Add type-based styling
    if (type === 'success') {
        toast.style.background = '#4caf50';
    } else if (type === 'error') {
        toast.style.background = '#ff4757';
    } else {
        toast.style.background = '#333';
    }
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Validate phone number on blur
phoneInput.addEventListener('blur', function() {
    if (this.value.length === 10) {
        const firstDigit = this.value.charAt(0);
        const validFirstDigits = ['6', '7', '8', '9'];
        
        if (!validFirstDigits.includes(firstDigit)) {
            showToast('Note: Number may not be a valid Indian mobile prefix', 'info');
        }
    }
});