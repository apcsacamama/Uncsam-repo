import { supabase } from "../lib/supabaseClient"; 
import {
  Card,
  CardContent,
  CardHeader,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { useState, useEffect } from "react";
import {
  Users,
  Shield,
  UserPlus,
  Loader2,
  Edit,
  Trash2,
  Save,
  X
} from "lucide-react";

// --- IMPORT THE HOOK HERE ---
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";

type UserProfile = {
  id: string;
  email: string; 
  full_name?: string;
  role: 'admin' | 'staff' | 'customer';
  created_at?: string;
};

export default function ManageAccounts() {
  const [accountTab, setAccountTab] = useState<'staff' | 'customer'>('staff');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(""); 

  // Form State
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({ email: "", full_name: "", role: "staff", password: "" });

  useEffect(() => {
    getCurrentUser();
    fetchProfiles();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.email) {
      setCurrentUserEmail(user.email);
    }
  };

  const fetchProfiles = async () => {
    setIsUserLoading(true);
    try {
      const { data, error } = await supabase
        .from('user')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // @ts-ignore 
      setProfiles(data || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setIsUserLoading(false);
    }
  };

  // --- ADD THE HOOK HERE ---
  // This will automatically re-run fetchProfiles whenever the user
  // clicks back onto this tab.
  useRefreshOnFocus(fetchProfiles);


  // --- HANDLERS ---
  const handleCreateUser = async () => {
    try {
      const { error } = await supabase
        .from('user')
        .insert([{
          email: userForm.email, 
          full_name: userForm.full_name,
          role: userForm.role
        }]);

      if (error) throw error;

      alert("Account profile created successfully!");
      fetchProfiles();
      setIsUserFormOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.code === '42P01') {
         alert("Database Error: Table 'user' does not exist or is named differently.");
      } else {
         alert(`Failed to create user: ${error.message}`);
      }
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUserId) return;
    try {
      const { error } = await supabase
        .from('user')
        .update({
          full_name: userForm.full_name,
          role: userForm.role
        })
        .eq('id', editingUserId);

      if (error) throw error;
      alert("User updated successfully!");
      fetchProfiles();
      setIsUserFormOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user.");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this account? This cannot be undone.")) return;
    try {
      const { error } = await supabase.from('user').delete().eq('id', id);
      if (error) throw error;
      fetchProfiles(); 
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user.");
    }
  };

  const resetForm = () => {
      setEditingUserId(null);
      setUserForm({ email: "", full_name: "", role: "staff", password: "" });
  };

  const openUserForm = (user?: UserProfile) => {
    if (user) {
      setEditingUserId(user.id);
      setUserForm({ 
        email: user.email || "", 
        full_name: user.full_name || "", 
        role: user.role, 
        password: "" 
      });
    } else {
      resetForm();
    }
    setIsUserFormOpen(true);
  };

  const filteredProfiles = profiles.filter(p => {
    if (p.email === "admin@demo.com") return false;
    if (p.email === currentUserEmail) return false;
    if (accountTab === 'staff') return p.role === 'admin' || p.role === 'staff';
    return p.role === 'customer'; 
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Accounts</h1>
                <p className="text-gray-500">Control access for staff and customers</p>
            </div>
            {accountTab === 'staff' && !isUserFormOpen && (
                <Button className="bg-red-600 hover:bg-red-700" onClick={() => openUserForm()}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Staff Member
                </Button>
            )}
        </div>

        <Card className="shadow-md">
            <CardHeader className="border-b bg-gray-50 p-0">
                <div className="flex">
                    <button
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${accountTab === 'staff' ? 'border-b-2 border-red-600 text-red-600 bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => { setAccountTab('staff'); setIsUserFormOpen(false); }}
                    >
                        <Shield className="w-4 h-4 inline mr-2" />
                        Staff & Admins
                    </button>
                    <button
                        className={`flex-1 py-4 text-sm font-medium transition-colors ${accountTab === 'customer' ? 'border-b-2 border-red-600 text-red-600 bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                        onClick={() => { setAccountTab('customer'); setIsUserFormOpen(false); }}
                    >
                        <Users className="w-4 h-4 inline mr-2" />
                        Customers
                    </button>
                </div>
            </CardHeader>
            
            <CardContent className="p-6">
                {/* --- FORM SECTION --- */}
                {isUserFormOpen ? (
                    <div className="max-w-md mx-auto animate-in fade-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingUserId ? 'Edit Account' : 'Create New Account'}
                            </h3>
                            <Button variant="ghost" size="sm" onClick={() => setIsUserFormOpen(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Full Name</label>
                                <Input 
                                    value={userForm.full_name} 
                                    onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Email Address</label>
                                <Input 
                                    type="email" 
                                    value={userForm.email} 
                                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                                    disabled={!!editingUserId}
                                    placeholder="user@example.com"
                                />
                            </div>
                            {!editingUserId && (
                                <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-md text-sm text-yellow-800">
                                   <strong>Note:</strong> Creating this profile does not create a password login. 
                                   Ask the staff member to "Sign Up" with this email to set their password.
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-medium text-gray-700">Role</label>
                                <select 
                                    className="w-full mt-1 p-2 border rounded-md text-sm bg-white focus:ring-2 focus:ring-red-500 outline-none"
                                    value={userForm.role}
                                    onChange={(e) => setUserForm({...userForm, role: e.target.value as any})}
                                >
                                    <option value="staff">Staff</option>
                                    <option value="admin">Admin</option>
                                    <option value="customer">Customer</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button className="flex-1 bg-gray-100 text-gray-800 hover:bg-gray-200" onClick={() => setIsUserFormOpen(false)}>
                                    Cancel
                                </Button>
                                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={editingUserId ? handleUpdateUser : handleCreateUser}>
                                    <Save className="w-4 h-4 mr-2" />
                                    {editingUserId ? 'Save Changes' : 'Create Account'}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* --- LIST SECTION --- */
                    <div className="space-y-3">
                        {isUserLoading ? (
                            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-red-600" /></div>
                        ) : filteredProfiles.length > 0 ? (
                            filteredProfiles.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow bg-white">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                            user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 
                                            user.role === 'staff' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                                        }`}>
                                            {user.role === 'admin' ? <Shield className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{user.full_name || "Unnamed User"}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="uppercase">{user.role}</Badge>
                                        {accountTab === 'staff' && (
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openUserForm(user)}>
                                                    <Edit className="w-4 h-4 text-gray-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed">
                                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-gray-900">No accounts found</h3>
                                <p className="text-gray-500">There are no users with the {accountTab} role.</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}