export interface EmergencyContact {
  name: string;
  phone: string;
}

export interface AdminProfile {
  id: string;
  type: "adminProfile";
  organizationId: string;
  adminUserId: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  profileImageUrl?: string;
  emergencyContact?: EmergencyContact;
  createdAt: string;
  updatedAt: string;
}

export type UpdateAdminProfileInput = Partial<
  Pick<
    AdminProfile,
    "fullName" | "email" | "phone" | "department" | "profileImageUrl" | "emergencyContact"
  >
>;
