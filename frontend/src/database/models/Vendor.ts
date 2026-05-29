import { Model } from '@nozbe/watermelondb'
import { text, field, readonly, date } from '@nozbe/watermelondb/decorators'

export default class Vendor extends Model {
  static table = 'vendors'

  @text('vendor_id') vendorId!: string
  @text('owner_id') ownerId!: string
  @text('business_name') businessName!: string
  @text('owner_name') ownerName!: string
  @field('years_in_business') yearsInBusiness!: number
  @text('categories') categoriesStr!: string
  @text('full_address') fullAddress!: string
  @text('location_link') locationLink?: string
  @text('phone_number') phoneNumber!: string
  @field('latitude') latitude?: number
  @field('longitude') longitude?: number
  @text('photos') photosStr!: string
  @text('business_description') businessDescription?: string
  @text('business_gallery_images') businessGalleryImagesStr?: string
  @text('menu_items') menuItemsStr?: string
  @field('offers_home_delivery') offersHomeDelivery?: boolean
  @field('offers_cash_on_delivery') offersCashOnDelivery?: boolean
  @text('business_hours') businessHours?: string
  @text('offers') offers?: string
  @text('kyc_status') kycStatus?: string
  @field('distance') distance?: number
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date

  get categories(): string[] {
    try { return JSON.parse(this.categoriesStr) } catch { return [] }
  }

  get photos(): string[] {
    try { return JSON.parse(this.photosStr) } catch { return [] }
  }

  get businessGalleryImages(): string[] {
    try { return JSON.parse(this.businessGalleryImagesStr || '[]') } catch { return [] }
  }

  get menuItems(): string[] {
    try { return JSON.parse(this.menuItemsStr || '[]') } catch { return [] }
  }
}
