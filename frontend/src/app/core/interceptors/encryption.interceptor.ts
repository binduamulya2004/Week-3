import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class EncryptionInterceptor implements HttpInterceptor {
  private secretKey = 'Tyjeehee734rgehrghjgeerb@758866f';

  encryptData(data: any): string {
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), this.secretKey).toString();
    console.log('Encrypted Payload (Frontend):', encrypted);
    return encrypted;
  }
  
  decryptData(encryptedData: string): any {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) {
      throw new Error('Decryption resulted in empty string');
    }
    return JSON.parse(decryptedText);
  }
  

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    console.log('Request Body (Frontend):', req.body); // Log the request body
    // Encrypt the request payload if it's not form data
    if(req.body instanceof FormData){
      return next.handle(req);
    }else{
        const encryptedRequest = req.clone({
            body: req.body ? { encryptedPayload: this.encryptData(req.body) } : req.body,
          });
        
          console.log('Encrypted Request Body (Frontend):', encryptedRequest.body); // Log the request body
        
    
        // Handle the request and decrypt the response payload
        return next.handle(encryptedRequest).pipe(
          map((event: HttpEvent<any>) => {
            if (event instanceof HttpResponse && event.body?.encryptedPayload) {
              const decryptedBody = this.decryptData(event.body.encryptedPayload);
              const clonedResponse = event.clone({ body: decryptedBody });
              return clonedResponse;
            }
            return event;
          })
        );
        //next.handle(encryptedRequest): This line passes the encrypted request (encryptedRequest) to the next handler in the HTTP pipeline.
        //  This sends the request out to the server, and the next.handle() method returns an observable of HTTP events (HttpEvent<any>).

        //.pipe(map(...)): The pipe() method is used to transform the observable stream. 
        // The map() operator is used to manipulate the emitted events as they pass through the pipeline. 
        // This will process each HTTP event emitted by the next.handle() observable.

    }
  }
}
