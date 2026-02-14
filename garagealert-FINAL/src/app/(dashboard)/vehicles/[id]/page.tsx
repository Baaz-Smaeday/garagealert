import { redirect } from 'next/navigation'

// For MVP, vehicle details are shown on the customer detail page
// This page redirects to the customer who owns the vehicle
export default function VehicleDetailPage() {
  // In Phase 2, this will be a full vehicle detail page
  redirect('/vehicles')
}
