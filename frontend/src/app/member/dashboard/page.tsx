"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MemberProfile {
  name: string;
  email: string;
  membership: {
    type: string;
    status: string;
    startDate: string;
    endDate: string;
  };
}

export default function MemberDashboard() {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/api/users/profile", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    window.location.href = "/";
  };

  const getMembershipColor = (type: string) => {
    switch (type) {
      case "basic": return "text-blue-600";
      case "premium": return "text-purple-600";
      case "vip": return "text-yellow-600";
      default: return "text-gray-600";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-green-600 bg-green-100";
      case "inactive": return "text-gray-600 bg-gray-100";
      case "suspended": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Member Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {profile?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Name</h3>
              <p className="text-lg font-medium text-gray-900">{profile?.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="text-lg font-medium text-gray-900">{profile?.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Membership Type</h3>
              <p className={`text-lg font-bold capitalize ${getMembershipColor(profile?.membership?.type || "")}`}>
                {profile?.membership?.type} Plan
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(profile?.membership?.status || "")}`}>
                {profile?.membership?.status}
              </span>
            </div>
          </div>
        </div>

        {/* Membership Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Membership Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
              <p className="text-lg font-medium text-gray-900">
                {profile?.membership?.startDate ? new Date(profile.membership.startDate).toLocaleDateString() : "N/A"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">End Date</h3>
              <p className="text-lg font-medium text-gray-900">
                {profile?.membership?.endDate ? new Date(profile.membership.endDate).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-600 text-white p-4 rounded-lg text-center hover:bg-blue-700 transition-colors cursor-pointer">
              <div className="text-2xl mb-2">👤</div>
              <div className="font-medium">Update Profile</div>
            </div>
            
            <div className="bg-green-600 text-white p-4 rounded-lg text-center hover:bg-green-700 transition-colors cursor-pointer">
              <div className="text-2xl mb-2">💳</div>
              <div className="font-medium">Upgrade Plan</div>
            </div>
            
            <div className="bg-purple-600 text-white p-4 rounded-lg text-center hover:bg-purple-700 transition-colors cursor-pointer">
              <div className="text-2xl mb-2">📞</div>
              <div className="font-medium">Contact Support</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
