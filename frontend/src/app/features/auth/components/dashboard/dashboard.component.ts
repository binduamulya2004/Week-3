import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders,HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import * as XLSX from 'xlsx';


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


  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;
  paginatedProducts: any[] = [];

  files: { name: string, size: string }[] = [];
  
 isProductModalOpen: boolean = false;
  addProductForm: FormGroup;
  categories: any;
  
  selectedProducts: any[] = [];
   allSelected: boolean = false; // Flag to track if all rows are selected

 

 constructor(private http: HttpClient, private fb: FormBuilder) {
    this.addProductForm = this.fb.group({
      productName: ['', Validators.required],
      category: ['', Validators.required],
      vendor: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      unitPrice: ['', [Validators.required, Validators.min(0)]],
      unit: ['', Validators.required],
    });
  }

 


  ngOnInit(): void {
    
    // Get the logged-in user's details after verifying the token
    this.fetchUserDetails();
    this.getVendorsCount();
    this.getProducts();

    
  }
  
  onCheckboxChange(event: any, product: any): void {
    if (event.target.checked) {
      this.selectedProducts.push(product);
    } else {
      const index = this.selectedProducts.findIndex(p => p.product_id === product.product_id);
      if (index !== -1) {
        this.selectedProducts.splice(index, 1);
      }
    }
  }

onHeaderCheckboxChange(event: any): void {
    this.allSelected = event.target.checked;
    this.products.forEach(product => {
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
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.selectedProducts);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Products': worksheet },
      SheetNames: ['Products']
    };

    XLSX.writeFile(workbook, 'selected_products.xlsx');
  }


 openProductModal() {
  this.isProductModalOpen = true;
}
 
closeProductModal() {
  this.isProductModalOpen = false;
}
  onFileSelect(event:any) {
   
 }
  addProduct() {
  
}
  
  getVendorsCount() {
  this.http.get<{ count: number }>(`${environment.apiUrl}/auth/vendors/count`).subscribe(
    (response) => {
      this.vendorCount = response.count; // Update vendor count
    },
    (error) => {
      console.error('Error fetching vendor count:', error);
    }
  );
}
  //all products 
  // getProducts() {
  //   this.http.get<any[]>(`${environment.apiUrl}/auth/products`).subscribe(
  //     (products) => {
  //       this.products = products; // Update products array
  //     },
  //     (error) => {
  //       console.error('Error fetching products:', error);
  //     }
  //   );
  // }


  getProducts() {
    const params = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('limit', this.itemsPerPage.toString());

    this.http.get<{ products: any[], totalItems: number }>(`${environment.apiUrl}/auth/products`, { params })
      .subscribe(
        (response) => {
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


  // Navigate to the previous page
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.getProducts();
    }
  }

  // Navigate to the next page
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.getProducts();
    }
  }
   

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  // Method to verify the token and retrieve user details
  fetchUserDetails() {
    const token = localStorage.getItem('token');

    if (token) {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });

      this.http.get(`${environment.apiUrl}/auth/user-details`, { headers })
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
    this.isModalOpen = true; // Show modal
  }
  openModal() {

    this.isModalOpen = false;

  }
  // Close the modal
  closeModal() {
    this.isModalOpen = false; // Hide modal
  }

  // Handle file selection
  //The onFileChange method is an event handler that is triggered whenever the user selects a file using the <input type="file"> element.
  onFileChange(event: any) {
    const file = event.target.files[0];// Get the first selected file
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

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.isUploading = true;

    this.http.post(`${environment.apiUrl}/auth/upload-profile-photo`, formData, { headers })
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
    localStorage.clear(); // Clear the local storage
    window.location.href = '/login'; // Redirect to login page
  }

}