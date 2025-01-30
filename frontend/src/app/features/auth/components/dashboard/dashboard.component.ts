import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import * as XLSX from 'xlsx';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import * as bootstrap from 'bootstrap';
import { Observable } from 'rxjs';
import { log } from 'console';
import {AuthService} from 'src/app/core/services/auth.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';



import {  SafeResourceUrl } from '@angular/platform-browser';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  username: string = ''; // Directly stores the username
  email: string = ''; // Directly stores the email
  thumbnail: string = ''; // Default profile picture
  dropdownOpen: boolean = false; // Flag to control dropdown visibility
  isModalOpen: boolean = false; // Flag to control modal visibility
  selectedFile: File | null = null; // Stores the selected file for upload
  isUploading: boolean = false; // Indicates if file is being uploaded
  
  vendorCount: number = 0;
  products: any[] = [];
  vendors: any[] = [];
  categories: any[] = [];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;
  paginatedProducts: any[] = [];
  uploadedFiles: any[] = [];
  selectedFiles: string[] = [];

  isProductModalOpen: boolean = false;
  addProductForm: FormGroup;
  selectedProducts: any[] = [];
  allSelected: boolean = false; // Flag to track if all rows are selected
  selectedProductId: number | null = null;
  fileName = "";
  searchTerm: string = '';
  selectedColumns: string[] = []; // No columns selected by default
  filterColumns: string[] = [
    'Product Name',
    'Status',
    'Category',
    'Vendors',
    'Quantity',
    'Unit',
  ];

  //search
  showFilters: boolean = false;
  columns = [
    { label: 'Product Name', key: 'product_name', checked: false },
    { label: 'Status', key: 'status', checked: false },
    { label: 'Category', key: 'category', checked: false },
    { label: 'Vendors', key: 'vendors', checked: false },
    { label: 'Quantity', key: 'quantity', checked: false },
    { label: 'Unit', key: 'unit', checked: false },
  ];


  selectedCategory: string = '';
  selectedVendor: string = '';
  selectedStatus: string = '';


  quantityChanges: { [key: number]: number } = {};
  flag = 1;
  selectedProductForEdit: any;
  editSelectedFile: File | null = null;
  fileData: any[] = [];
  showCart: boolean = false;
  currentCartPage: number = 1;
  totalCartPages: number = 1;
  cartPageSize: number = 5; 
  totalCartItems: number = 0;
  cartPages: number[] = [];
  cartProducts: any[] = [];
  userId: any;
  

  files: File[] = [];
  isDragging: boolean = false;
  isModalOpenprofile=false;

  previewFileUrl: SafeResourceUrl | null = null;
  fileUrl="";


  constructor(private http: HttpClient,  private router: Router, private fb: FormBuilder,private authService: AuthService,private sanitizer: DomSanitizer) {
    this.addProductForm = this.fb.group({
      productName: ['', Validators.required],
      category: ['', Validators.required],
      vendor: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      unitPrice: ['', [Validators.required, Validators.min(0)]],
      unit: ['', Validators.required],
      status: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // Get the logged-in user's details after verifying the token
    this.fetchUserDetails();
    this.getVendorsCount();
    // this.getProducts();
    this.loadProducts();
    this.getCategories();
    this.getVendors();
    this.fetchCartPage(this.currentCartPage);
    this.fetchUploadedFiles();
  }
  // ngDoCheck(): void {
  //   // console.log('ngDoCheck Called');
  //   if (!this.showCart && this.flag == 1) {
  //     this.applyQuantityChanges(); 
  //     this.flag = 0;
  //   }
  // }

  redirectTochatApp(){
    this.router.navigate(['/chat']);
  }

  toggleTable(view: string): void {
    if (view === 'cart') {
      this.showCart = true;
    } else {
      this.showCart = false;
      this.flag = 1;
    }
  }

  updateQuantity(product:any, change: number): void {
    console.log(change);
    console.log(product.quantity_in_stock);
    const var1 = product.quantity + change;
    console.log(product.quantity);
    console.log('newQuantity in cart:', var1);
    product.quantity = var1;
     const diff=change;

    const payload = {
      productId:product.product_id,
      diff: diff,
    };


    this.http
    .put<any>(`${environment.apiUrl}/auth/update-cart-quantity`, {payload})
    .subscribe({
      next: (response) => {
        console.log('Cart quantity updated successfully:', response);
        this.fetchCartPage(this.currentCartPage); 
        this.loadProducts();
        this.quantityChanges = {}; 
      },
      error: (error) => {
        console.error('Error updating cart items quantity:', error);
      },
    });


  }


  adjustQuantity(product: product, change: number): void {
  const newQuantity = product.quantity_in_stock + change;
  console.log('new quantity',newQuantity);

  // Ensure the new quantity does not exceed stock and is not negative
  if (newQuantity >= 0 && newQuantity <= product.quantity_in_stock) {
    product.quantity_in_stock = newQuantity;
  } else if (newQuantity > product.quantity_in_stock) {
    alert(`You cannot exceed the available stock (${product.quantity_in_stock}).`);
  } else if (newQuantity < 0) {
    alert('Quantity cannot be negative.');
  }
  }

  fetchCartPage(page: number): void {
    if (page < 1 || (this.totalCartPages && page > this.totalCartPages)) return;

    const limit = this.cartPageSize;

    // Directly call the backend API to fetch cart items
    this.http
      .get<{
        success: string;
        products: product[];
        total: number;
        page: number;
        limit: number;
      }>(`${environment.apiUrl}/auth/cart?page=${page}&limit=${limit}`)
      .subscribe({
        next: (data) => {
          console.log(data);
          this.cartProducts = data.products;
          this.totalCartItems = data.total;
          this.currentCartPage = data.page;
          this.totalCartPages = Math.ceil(
            this.totalCartItems / this.cartPageSize
          );
          this.cartPages = Array.from(
            { length: this.totalCartPages },
            (_, i) => i + 1
          );
          console.log(this.cartPages);
          console.log('cartProducts: ', this.cartProducts);
        },
        error: (error) => {
          console.error('Error fetching cartProducts:', error);
        },
      });
  }

  applyQuantityChanges(): void {
    const updatedProducts = Object.keys(this.quantityChanges)
      .filter((product_id) => this.quantityChanges[+product_id] !== 0) 
      .map((product_id) => ({
        productId: +product_id,
        changeInQuantity: this.quantityChanges[+product_id],
      }));

    if (updatedProducts.length > 0) {
      this.http
        .put<any>(`${environment.apiUrl}/auth/cart/update`, updatedProducts)
        .subscribe({
          next: (response) => {
            console.log('Cart items updated successfully:', response);
            this.fetchCartPage(this.currentCartPage); 
            this.loadProducts();
            this.quantityChanges = {}; 
          },
          error: (error) => {
            console.error('Error updating cart items:', error);
          },
        });
    }

  }

  deleteCartItem(cartId: number): void {
    this.http
      .delete<any>(`${environment.apiUrl}/auth/delete-cart-item/${cartId}`)
      .subscribe({
        next: () => {
          this.fetchCartPage(this.currentCartPage);
          this.loadProducts();
          alert('cart item deleted succesfully')
        },
        error: (err) => {
          console.error('Error deleting cart item:', err);
        },
      });
  }

  moveSelectedProducts(): void {
    const selectedProducts = this.selectedProducts
      .filter((product) => product.isSelected)
      .map((product) => {
        console.log('Product object:', product); // Log to check the structure of the product
        return {
          productId: product.product_id,
          vendorId: product.selectedVendorId,
          quantity: product.quantity_in_stock,
        };
      });
  
    if (selectedProducts.length === 0) {
      alert('Please select at least one product to move.');
      return;
    }
  
    console.log('Selected products in frontend:', selectedProducts);
  
    this.http
      .post(`${environment.apiUrl}/auth/move-to-cart`, { products: selectedProducts })
      .subscribe({
        next: (response) => {
          console.log('Products moved successfully to the cart:', response);
          alert('Products moved successfully to the cart:');
          this.loadProducts();
          this.fetchCartPage(this.currentCartPage);
  
          // Update the cart after moving products
        
          
        },
        error: (moveError) => {
          alert('Failed to move products to the cart.');
          console.error('Error moving products to the cart:', moveError);
        },
      });
  }
  
  clearSelectedProducts() {
    this.selectedProducts = [];

    this.loadProducts();
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  onSearch(event: Event) {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm = searchTerm;
    console.log('Search term:', searchTerm);

    // Call `getProducts` with the current search term and selected columns
    const selectedColumnsKeys = this.columns
      .filter((col) => col.checked)
      .map((col) => col.key);
  }

  // Apply search and filter products
  applySearch() {
    if (this.searchTerm) {
      this.paginatedProducts = this.products.filter((product) =>
        product.product_name.toLowerCase().includes(this.searchTerm)
      );
    } else {
      this.paginatedProducts = [...this.products]; // Reset to original products if search term is empty
    }
  }


  // Get filtered products with search term and selected columns
  getFilteredProducts(searchTerm: string, columns: string): void {
    const params = {
      page: '1', // Adjust page dynamically based on user interaction
      limit: '10', // Adjust this as needed
      searchTerm: searchTerm,
      columns: columns || '*', // If no columns selected, send '*' for all
    };

    console.log('Search Term:', this.searchTerm);
    console.log('Selected Columns:', this.selectedColumns);

    this.http
      .get<{ products: any[]; totalItems: number }>(
        `${environment.apiUrl}/auth/products`,
        { params }
      )
      .subscribe(
        (response) => {
          // Handle the response, e.g., set products to the component's products array
          console.log('Filtered products:', response.products);
        },
        (error) => {
          console.error('Error applying filters:', error);
        }
      );
  }


  getProducts() {
    const params = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('limit', this.itemsPerPage.toString());

    this.http
      .get<{ products: any[]; totalItems: number }>(
        `${environment.apiUrl}/auth/products`,
        { params }
      )
      .subscribe(
        (response) => {
          console.log('products -', response);
          this.products = response.products;
          this.totalItems = response.totalItems;
          this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
          this.paginatedProducts = this.products;
        },
        (error) => {
          console.error('Error fetching products:', error);
        }
      );
  }

  
  showDeleteModal(product: any) {
    this.selectedProductId = product.product_id; // Store the product ID to delete
    const modal = new bootstrap.Modal(
      document.getElementById('deleteConfirmationModal')!
    );
    modal.show();
  }

  // Confirm the deletion of the product
  confirmDelete() {
    if (this.selectedProductId) {
      this.http
        .delete(`${environment.apiUrl}/auth/products/${this.selectedProductId}`)
        .subscribe(
          (response: any) => {
            alert(response.message); // Success message from the backend
            // Update the UI to reflect the deletion
            this.getProducts();

          },
          (error) => {
            alert('Failed to delete the product');
            console.error(error);
          }
        );
    }

    // Close the modal after the operation
    const modal = bootstrap.Modal.getInstance(
      document.getElementById('deleteConfirmationModal')!
    );
    modal?.hide();
  }

  downloadProduct(product: any) {
    console.log('Product to download:', product);
    const doc = new jsPDF();
  
    // Extract product details excluding image
    const { product_id, product_name, category_name, unit_price, vendors } = product;
  
    // Add product details to the PDF
    doc.text('Product Details', 20, 20);
    doc.text(`Product ID: ${product_id}`, 20, 30);
    doc.text(`Product Name: ${product_name}`, 20, 40);
    doc.text(`Price: ${unit_price}`, 20, 50);
    doc.text(`Category: ${category_name}`, 20, 60);
  
    // Add vendors details
    doc.text('Vendors:', 20, 70);
    if (vendors && Array.isArray(vendors) && vendors.length > 0) {
      vendors.forEach((vendor: any, index: number) => {
        doc.text(`${index + 1}. ${vendor}`, 30, 80 + index * 10); // Adjust Y position dynamically
      });
    } else {
      doc.text('No vendors available', 30, 80);
    }
  
    // Save the PDF
    doc.save(`${product_name}_${product_id}.pdf`);
  }
  

  editProduct(product: any) {
    product.isEditing = true;
    product.originalData = { ...product }; // Store original data in case of cancel
  }

  saveProduct(product: any) {
    const updatedProductData = {
      product_id: product.product_id,
      product_name: product.product_name,
      category_id: product.category_id,
      quantity_in_stock: product.quantity_in_stock,
      unit_price: product.unit_price,
      product_image: product.product_image,
      status: product.product_status,
      unit: product.unit,
      vendor_id: product.vendor_id, // Include vendor ID
    };

    console.log('Updated product data:', updatedProductData);
    this.http
      .put(
        `${environment.apiUrl}/auth/products/${product.product_id}`,
        updatedProductData
      )
      .subscribe(
        (response: any) => {
          console.log('Product updated successfully:', response);
          product.isEditing = false;

          if (product.selectedFile) {
            const formData = new FormData();
            formData.append('product_image', product.selectedFile);
            formData.append('productId', product.product_id); // Include product ID in the form data

            const token = this.authService.getAccessToken();

            const headers = new HttpHeaders({
              Authorization: `Bearer ${token}`,
            });

            this.isUploading = true;

            this.http
              .post(
                `${environment.apiUrl}/auth/upload-product-image`,
                formData,
                { headers }
              )
              .subscribe(
                (uploadResponse: any) => {
                  console.log('File uploaded successfully:', uploadResponse);
                  product.product_image = uploadResponse.url; // Update the product image URL
                  this.isUploading = false;
                },
                (error) => {
                  console.error('Error uploading file:', error);
                  this.isUploading = false;
                }
              );
          }
        },
        (error) => {
          console.error('Error updating product:', error);
        }
      );
  }

  onFileSelectPro(event: any, product: any) {
    const file = event.target.files[0];
    if (file) {
      product.selectedFile = file; // Store the selected file in the product object
      console.log('Selected file:', file);
    }
  }

  cancelEdit(product: any) {
    Object.assign(product, product.originalData); // Restore original data
    product.isEditing = false;
  }
  getCategories() {
    this.http
      .get<{ categories: any[] }>(`${environment.apiUrl}/auth/categories`)
      .subscribe(
        (response) => {
          this.categories = response.categories;
        },
        (error) => {
          console.error('Error fetching categories:', error);
        }
      );
  }

  getVendors() {
    this.http
      .get<{ vendors: any[] }>(`${environment.apiUrl}/auth/vendors`)
      .subscribe(
        (response) => {
          this.vendors = response.vendors;
        },
        (error) => {
          console.error('Error fetching vendors:', error);
        }
      );
  }

  onCheckboxChange(event: any, product: any): void {
    if (event.target.checked) {
      this.selectedProducts.push(product);
    } else {
      const index = this.selectedProducts.findIndex(
        (p) => p.product_id === product.product_id
      );
      if (index !== -1) {
        this.selectedProducts.splice(index, 1);
      }
    }
  }

  onHeaderCheckboxChange(event: any): void {
    this.allSelected = event.target.checked;
    this.products.forEach((product) => {
      product.selected = this.allSelected;
      if (this.allSelected) {
        if (!this.selectedProducts.includes(product)) {
          this.selectedProducts.push(product);
        }
      } else {
        this.selectedProducts = [];
      }
    });
  }

  downloadExcel(): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(
      this.selectedProducts
    );
    const workbook: XLSX.WorkBook = {
      Sheets: { Products: worksheet },
      SheetNames: ['Products'],
    };

    XLSX.writeFile(workbook, 'selected_products.xlsx');
  }

  openProductModal() {
    this.isProductModalOpen = true;
  }

  closeProductModal() {
    this.isProductModalOpen = false;
  }
  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file; // Store the selected file in the selectedFile variable
      console.log('Selected file:', file);
    }
  }



  addProduct() {
    if (this.addProductForm.valid) {
        const productData = this.addProductForm.value;
        console.log('***** in frontend ');
        console.log(productData);

        const vendors = productData.vendor; // Array of selected vendor IDs
        console.log(vendors);
        delete productData.vendor; // Remove vendor field from productData to handle separately
        console.log(vendors);

        this.http
            .post(`${environment.apiUrl}/auth/products`, { productData, vendors }) // Send productData and vendors array
            .subscribe(
                (response: any) => {
                    console.log('Product added successfully:', response);
                    const newProduct = response.product;

                    this.products.push(newProduct); // Update the products array with the new product

                    if (this.selectedFile) {
                        const formData = new FormData();
                        formData.append('product_image', this.selectedFile);
                        formData.append('productId', newProduct.product_id); // Include product ID in the form data

                        const token = this.authService.getAccessToken();
                        const headers = new HttpHeaders({
                            Authorization: `Bearer ${token}`,
                        });

                        this.isUploading = true;

                        this.http
                            .post(
                                `${environment.apiUrl}/auth/upload-product-image`,
                                formData,
                                { headers }
                            )
                            .subscribe(
                                (uploadResponse: any) => {
                                    console.log('File uploaded successfully:', uploadResponse);
                                    newProduct.product_image = uploadResponse.url; // Update the product image URL
                                    this.isUploading = false;
                                    this.closeProductModal();
                                    alert('Product added successfully!');

                                    this.loadProducts();
                                },
                                (error) => {
                                    console.error('Error uploading file:', error);
                                    this.isUploading = false;
                                }
                            );
                    } else {
                        this.closeProductModal();
                        alert('Product added successfully!');
                    }
                },
                (error) => {
                    console.error('Error adding product:', error);
                }
            );
    } else {
        console.error('Form is invalid');
    }
}


  saveProductData(productData: any) {
    this.http
      .post(`${environment.apiUrl}/auth/products`, productData)
      .subscribe(
        (response: any) => {
          console.log('Product added successfully:', response);
          this.products.push(response.product); // Update the products array with the new product
          this.closeProductModal();
        },
        (error) => {
          console.error('Error adding product:', error);
        }
      );
  }

  getVendorsCount() {
    this.http
      .get<{ count: number }>(`${environment.apiUrl}/auth/vendors/count`)
      .subscribe(
        (response) => {
          this.vendorCount = response.count; // Update vendor count
        },
        (error) => {
          console.error('Error fetching vendor count:', error);
        }
      );
  }
  
  // Navigate to the previous page
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      // this.getProducts();
      this.loadProducts();
    }
  }

  // Navigate to the next page
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      // this.getProducts();
      this.loadProducts();
    }
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  // Method to verify the token and retrieve user details
  fetchUserDetails() {
    const token = this.authService.getAccessToken();


    if (token) {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });

      this.http
        .get(`${environment.apiUrl}/auth/user-details`, { headers })
        .subscribe(
          (response: any) => {
            this.username = response.username;
            this.email = response.email;
            this.thumbnail = response.profile_pic || 'assets/photo.jpg';
          },
          (error) => {
            console.error('Error fetching user details:', error);
            this.logout();
          }
        );
    }
  }

  // Open modal to upload profile photo
  openProfilePhotoModal() {
    this.isModalOpenprofile = true; // Show modal
  }
  openModal() {
    this.isModalOpen = false;
  }
  closeModalprofile(){
    this.isModalOpenprofile = false;

  }
  // Close themodal
  closeModal() {
    this.isModalOpen = false; // Hide modal
  }


  //The onFileChange method is an event handler that is triggered whenever the user selects a file using the <input type="file"> element.
  onFileChange(event: any) {
    const file = event.target.files[0]; // Get the first selected file
    if (file) {
      this.selectedFile = file; // Store the selected file in the selectedFile variable
      console.log('Selected file:', file);
    }
  }

  // Upload the profile photo to the backend
  uploadProfilePhoto() {
    if (!this.selectedFile) {
      alert('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('profile_pic', this.selectedFile);

    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.isUploading = true;

    this.http
      .post(`${environment.apiUrl}/auth/upload-profile-photo`, formData, {
        headers,
      })
      .subscribe(
        (response: any) => {
          console.log('File uploaded successfully:', response);
          this.thumbnail = response.url; // Update the profile picture in the UI
          this.isUploading = false;
        },
        (error) => {
          console.error('Error uploading file:', error);
          this.isUploading = false;
        }
      );
  }

  // Logout method to clear localStorage and redirect to login page
  logout(): void {
    this.authService.clearTokens();
    window.location.href = '/login'; // Redirect to login page
  }

  //right side of the container
  fetchUploadedFiles() {
   const token = this.authService.getAccessToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    this.http
      .get<any>(`${environment.apiUrl}/auth/files`, { headers })
      .subscribe(
        (response: any) => {
          console.log('Fetched Files:', response);
          if (Array.isArray(response.files)) {
            this.uploadedFiles = response.files.map(
              (file: {
                key: string;
                url: any;
                size: any;
                lastModified: any;
              }) => ({
                name: file.key.split('/').pop(), // Extract the file name from the key
                url: file.url,
                size: file.size,
                lastModified: file.lastModified,
              })
            );
            console.log('Uploaded Files:', this.uploadedFiles);
          } else {
            console.error(
              'Invalid response: Expected an array of files',
              response
            );
          }
        },
        (error) => {
          console.error('Error fetching files:', error);
        }
      );
  }

  // Handle file drag over event
  onDragOver(event: DragEvent) {
    event.preventDefault(); // Allow the drop
    const dropzone = document.querySelector('.drag-drop-area')!;
    dropzone.classList.add('dragover');
  }

  // Handle file drag leave event
  onDragLeave(event: DragEvent) {
    const dropzone = document.querySelector('.drag-drop-area')!;
    dropzone.classList.remove('dragover');
  }

  // Handle file drop event
  onDrop(event: DragEvent) {
    event.preventDefault(); // Prevent the default drop behavior
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      console.log('Dropped files:', files);
      this.selectedFile = files[0]; // If you want to select the first file
    }

    const dropzone = document.querySelector('.drag-drop-area')!;
    dropzone.classList.remove('dragover'); // Remove dragover style after drop
  }

  // Upload the file to the backend
  uploadFiles() {
    if (this.selectedFile) {
      const formData = new FormData();
      console.log(formData);
      formData.append('file', this.selectedFile);
      const token = this.authService.getAccessToken();
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });

      this.http
        .post(`${environment.apiUrl}/auth/upload`, formData, {
          headers,
        })
        .subscribe(
          (response) => {
            const fileName = (response as { fileName: string }).fileName;
            this.storeFileName(fileName); // Store fileName in local storage
            this.fetchUploadedFiles(); // Refresh the file list after upload
            this.closeModal();
          },
          (error) => {
            console.error('Error uploading files:', error);
          }
        );
    }
  }

   // Store file name in local storage
   storeFileName(fileName: string) {
    let fileNames = JSON.parse(localStorage.getItem('fileNames') || '[]');
    fileNames.push(fileName);
    localStorage.setItem('fileNames', JSON.stringify(fileNames));
  }

  // Handle the selection of files for download
  toggleFileSelection(fileName: string) {
    const index = this.selectedFiles.indexOf(fileName);
    if (index === -1) {
      this.selectedFiles.push(fileName);
    } else {
      this.selectedFiles.splice(index, 1);
    }
  }
  openModalFile() {
    this.isModalOpen = true;
  }

  // Close the modal
  closeModalFile() {
    this.isModalOpen = false;
  }

  downloadAllFile() {
    if (this.selectedFiles.length === 1) {
      // If only one file is selected, download it directly
      const selectedFileName = this.selectedFiles[0];
      this.http
        .post(
          `${environment.apiUrl}/auth/download`,
          { fileNames: [selectedFileName] },
          { responseType: 'blob' }
        )
        .subscribe((blob) => {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = selectedFileName; // Download the single file with its name
          link.click(); // Trigger the download
        });
    } else if (this.selectedFiles.length > 1) {
      // If more than one file is selected, download them as a zip
      this.http
        .post(
          `${environment.apiUrl}/auth/download`,
          { fileNames: this.selectedFiles },
          { responseType: 'blob' }
        )
        .subscribe((blob) => {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'files.zip'; // Specify the name of the downloaded zip file
          link.click(); // Trigger the download
        });
    } else {
      // If no files are selected, download all files
      const allFileNames = this.uploadedFiles.map((file) => file.name);
      this.http
        .post(
          `${environment.apiUrl}/auth/download`,
          { fileNames: allFileNames },
          { responseType: 'blob' }
        )
        .subscribe((blob) => {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'files.zip'; // Specify the name of the downloaded zip file
          link.click(); // Trigger the download
        });
    }
  }

  
  // Prevent checkbox toggle when clicking on the label
  preventCheckboxToggle(event: Event) {
    event.preventDefault();
  }
  // Download individual file
  downloadFile(fileUrl: string) {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileUrl.split('/').pop()!;
    link.click();
  }
  onFileSelectimport(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadFilesforimport(): void {
    if (!this.selectedFile) {
      alert('Please select a file first.');
      return;
    }
    const reader = new FileReader();

    // Read the file
    reader.onload = (e: any) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log('File data as JSON:', jsonData);

        // Post the JSON data to the backend
        this.http
          .post(`${environment.apiUrl}/auth/import`, jsonData)
          .subscribe({
            next: (response: any) => {
              alert('Files uploaded and data imported successfully.');
              console.log('Response:', response);
              this.loadProducts();
              // Optionally refresh data
              // this.getProducts();
            },
            error: (error) => {
              console.error('Error uploading files:', error);
              alert('Failed to upload files.');
            },
          });
      } catch (error) {
        console.error('Error processing file:', error);
        alert('Invalid file format.');
      }
    };

    // Read the first file as a binary string
    reader.readAsBinaryString(this.selectedFile);
  }

  // Wrapper function for button click
  uploadFilesImport(): void {
    this.uploadFilesforimport();
  }


  previewFile(fileName: string) {
    this.fileName=  fileName
    const userId = this.authService.getUserId();
  
    if (!userId || !fileName) {
      console.error('User ID or file name is undefined');
      return;
    }
  
    const fileUrl = `https://${environment.awsBucketName}.s3.${environment.awsRegion}.amazonaws.com/bindu@AKV0796/${userId}/${fileName}`;
    console.log('File URL:', fileUrl); // Debugging purpose
  
    if (this.isImage(fileUrl) || this.isPDF(fileUrl)) {
      // Handle image or PDF previews
      this.previewFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
      console.log('Preview URL for image/pdf:', this.previewFileUrl);
    } else if (this.isXLSX(fileUrl)) {
      // Handle .xlsx file previews
      const officeViewerBaseUrl = 'https://view.officeapps.live.com/op/embed.aspx?src=';
      const officeUrl = `${officeViewerBaseUrl}${encodeURIComponent(fileUrl)}`;
      this.previewFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(officeUrl);
      console.log('Preview URL for .xlsx:', this.previewFileUrl);
    } else {
      console.error('Unsupported file type.');
      this.previewFileUrl = null;
    }
  }
  
  setPreviewFileUrl(fileUrl:string): void {
    this.previewFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
  }
  
  // Check if the file is an image
  isImage(fileUrl: string): boolean {
    return /\.(jpeg|jpg|png|gif|webp)$/i.test(fileUrl);
  }

  // Check if the file is a PDF
  isPDF(fileUrl: string): boolean {
    return fileUrl.endsWith('.pdf');
  } 

  isXLSX(fileUrl: string): boolean {
    return fileUrl.endsWith('.xlsx');
  }
  


  searchQuery(event: any) {
    this.searchTerm = event.target.value.toLowerCase();
    this.loadProducts();
  }

// Toggle selected columns
onColumnToggle(column: any) {
  column.checked = !column.checked;
  this.applyFilters();
}

// Apply Filters
applyFilters(): void {
  this.loadProducts();
}


// Load Products with dynamic filtering based on selected columns
loadProducts(): void {
  const params = new HttpParams()
    .set('page', this.currentPage.toString())
    .set('limit', this.itemsPerPage.toString());

  this.http
    .get<{ products: any[]; totalItems: number }>(
      `${environment.apiUrl}/auth/products`,
      { params }
    )
    .subscribe({
      next: (response) => {
        let filteredProducts = response.products;
        console.log('****', filteredProducts);

        // Ensure 'vendors' is always an array of strings
        filteredProducts = filteredProducts.map((product) => {
          if (typeof product.vendors === 'string') {
            product.vendors = [product.vendors]; // Convert single string to array
          }
          return product;
        });

        this.totalPages = Math.ceil(response.totalItems / this.itemsPerPage);

        // Apply selected category filter first
        if (this.selectedCategory) {
          filteredProducts = filteredProducts.filter(
            (product) => product.category_name === this.selectedCategory
          );
        }

        // Apply search filtering based on checked columns
        if (this.searchTerm) {
          filteredProducts = filteredProducts.filter((product) => {
            return this.columns.some(column => 
              column.checked && this.filterByColumn(product, column.key)
            );
          });
        }

        // Apply selected vendor filter
        if (this.selectedVendor) {
          filteredProducts = filteredProducts.filter(
            (product) => product.vendors.includes(this.selectedVendor)
          );
        }

        // Apply selected status filter
        if (this.selectedStatus !== '') {
          filteredProducts = filteredProducts.filter(
            (product) => product.status === this.selectedStatus
          );
        }

        // Update the products list
        this.products = filteredProducts;
      },
      error: (error) => {
        console.error('Error fetching products:', error);
      },
    });
}

// Filter based on the selected column
filterByColumn(product: any, key: string): boolean {
  const searchTermLower = this.searchTerm.toLowerCase();

  if (key === 'vendors') {
    // Check vendors array against search term
    return product.vendors && product.vendors.some((vendor: string) => vendor.toLowerCase().includes(searchTermLower));
  } else if (key === 'category') {
    // Check category against search term; ensure it's looking in the correct property
    return product.category_name && product.category_name.toLowerCase().includes(searchTermLower);
  }

  // Default case for other fields
  return product[key] && product[key].toString().toLowerCase().includes(searchTermLower);
}


getFileIcon(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'assets/icons/pdf-icon.png';
    case 'jpg':
    case 'jpeg':
    case 'png':
      return 'assets/icons/image-icon.png';
    case 'doc':
    case 'docx':
      return 'assets/icons/doc-icon.png';
    case 'fig':
      return 'assets/icons/fig-icon.png';
    case 'mp4':
      return 'assets/icons/video-icon.png';
    default:
      return 'assets/icons/default-file-icon.png';
  }
}

}

export interface product {
vendor_id: any;
vendors: any;
isEditing: any;
  product_id: number;
    category_id: number; 
    category_name: string;
    category_status: number;
    unit_price: number;
    currentQuantity:number;
    isSelected: boolean;
    selectedVendorId : number|null;
    selectedVendorIds : number[]| [];
    product_image: string;
    product_name: string;
    product_status: number;
    quantity_in_stock: number;
    unit: string;
}
