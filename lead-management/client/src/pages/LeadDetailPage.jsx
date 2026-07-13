import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { Award, AlertTriangle, Sparkles } from 'lucide-react';
import { leadsService, teamsService, developersService } from '../services/mockData';
import { formatCurrency } from '../utils/currency';
import { useAuth } from '../context/AuthContext';

// Refactored Journey Components
import { LeadJourneyLayout } from '../components/lead/LeadJourneyLayout';
import { LeadActionBar } from '../components/lead/LeadActionBar';
import { LeadPhaseNavbar } from '../components/lead/LeadPhaseNavbar';
import { LeadPhaseSection } from '../components/lead/LeadPhaseSection';
import { LeadContent } from '../components/lead/LeadContent';
import { LeadTimeline } from '../components/lead/LeadTimeline';
import { QualificationSection } from '../components/lead/QualificationSection';
import { DiscoverySection } from '../components/lead/DiscoverySection';
import { SolutionSection } from '../components/lead/SolutionSection';
import { DeliverySection } from '../components/lead/DeliverySection';
import { SuccessSection } from '../components/lead/SuccessSection';
import { LeadStatusModal } from '../components/lead/LeadStatusModal';

export function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, branch: authBranch, leaderId } = useAuth();
  
  const [lead, setLead] = useState(null);
  const [journey, setJourney] = useState(null);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusModalMode, setStatusModalMode] = useState(null); // 'Won' or 'Lost' or null
  
  const [errorMsg, setErrorMsg] = useState(null);
  
  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [fetchedLead, fetchedJourney, fetchedLeaders, fetchedDevelopers] = await Promise.all([
        leadsService.getById(id),
        leadsService.getJourney(id),
        teamsService.getAll(),
        developersService.getAll().catch(() => [])
      ]);
      
      if (!fetchedLead) {
        navigate('/leads');
        return;
      }

      // Security guards: Branch Managers can only view leads from their own branch
      if (role === 'branch_manager' && fetchedLead.branchId !== authBranch) {
        navigate('/unauthorized');
        return;
      }

      // Ensure teamLeaders is an array, handling both mock array and backend paginated response
      const leadersArray = (fetchedLeaders && fetchedLeaders.data && Array.isArray(fetchedLeaders.data)) 
        ? fetchedLeaders.data 
        : (Array.isArray(fetchedLeaders) ? fetchedLeaders : []);

      // Security guards: Team Leaders can only view leads assigned to them
      if (role === 'team_leader') {
        const myProfile = leadersArray.find(tl => tl.id === leaderId);
        const myTeamId = myProfile ? (myProfile.teamId || myProfile.team_id) : null;
        if (fetchedLead.assignedTo !== leaderId && fetchedLead.assignedTo !== myTeamId) {
          navigate('/unauthorized');
          return;
        }
      }
      
      setLead(fetchedLead);
      setJourney(fetchedJourney);
      setTeamLeaders(leadersArray);
      setDevelopers(Array.isArray(fetchedDevelopers) ? fetchedDevelopers : []);
    } catch (err) {
      console.error("Error loading journey details:", err);
      let errMsg = err.message || "Unknown error occurred";
      if (err.response && err.response.data) {
        errMsg = err.response.data.message || (err.response.data.error && err.response.data.error.message) || errMsg;
      }
      setErrorMsg(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdateQualification = async (qualData) => {
    if (qualData.status === 'Unqualified') {
      setStatusModalMode('Lost');
      return;
    }
    
    // Update the core lead fields
    const leadPayload = {
      budget: Number(qualData.budget) || 0,
      expected_revenue: Number(qualData.expectedRevenue) || 0,
      decision_maker: qualData.decisionMaker,
      expected_start_date: qualData.expectedStartDate || null,
      project_type: qualData.projectType,
      priority: qualData.priority,
      business_need: qualData.businessNeed,
      status: qualData.status,
    };
    await leadsService.update(id, leadPayload);
    
    // Update the journey stage
    await leadsService.updateStatus(id, qualData.status, { remarks: qualData.businessNeed });
    
    Object.assign(lead, qualData);
    await loadData();
  };

  const handleAddCommunication = async (commData) => {
    await leadsService.createCommunication(id, commData);
    await loadData();
  };

  const handleAddRequirement = async (reqData) => {
    await leadsService.createRequirement(id, reqData);
    await loadData();
  };

  const handleUpdateProposal = async (proposalData) => {
    await leadsService.updateProposal(id, proposalData);
    await loadData();
  };


  const handleUpdateDelivery = async (delData) => {
    await leadsService.updateDelivery(id, delData);
    await loadData();
  };

  const handleUpdateCustomerSuccess = async (csData) => {
    await leadsService.updateCustomerSuccess(id, csData);
    await loadData();
  };

  const handleStatusModalSubmit = async (details) => {
    const finalStatus = statusModalMode === 'Lost' ? 'Closed Lost' : 'Closed Won';
    await leadsService.updateStatus(id, finalStatus, details);
    setStatusModalMode(null);
    await loadData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-semibold animate-pulse text-sm">Loading lead journey milestones...</p>
      </div>
    );
  }

  if (!lead || !journey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold text-gray-800">Failed to Load Lead Details</h2>
        <p className="text-gray-500 max-w-md text-center">
          The lead data or journey milestones could not be retrieved. Please check your connection or verify if this lead exists.
        </p>
        {errorMsg && (
          <div className="mt-4 p-4 bg-rose-50 text-rose-700 text-sm rounded-lg max-w-lg overflow-auto">
            <strong>Error Details:</strong> {errorMsg}
          </div>
        )}
        <button 
          onClick={() => navigate('/leads')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
        >
          Go Back to Leads
        </button>
      </div>
    );
  }

  const assignedTL = teamLeaders.find(tl => tl.id === lead.assignedTo || tl.teamId === lead.assignedTo);
  const teamLeaderName = assignedTL ? assignedTL.name : '';

  // Scope developers to the assigned team leader's team
  const teamDevs = assignedTL ? developers.filter(d => d.teamId === assignedTL.teamId) : developers;

  return (
    <>
      <LeadJourneyLayout
        actionBar={
          <LeadActionBar 
            lead={lead} 
            teamLeaderName={teamLeaderName}
            onMarkWon={() => setStatusModalMode('Won')}
            onMarkLost={() => setStatusModalMode('Lost')}
          />
        }
        phaseNavbar={
          <LeadPhaseNavbar 
            leadStatus={lead.status} 
            lostPhaseName={journey.issue?.phaseLostAt} 
          />
        }
        content={
          <LeadContent>
            {/* Won Success Card (if won) */}
            {lead.status === 'Closed Won' && journey.successRecord && (
              <Card className="bg-emerald-50 border-emerald-200 overflow-hidden shadow-2xs">
                <CardContent className="p-6 flex items-start space-x-4">
                  <div className="p-3 bg-emerald-500 rounded-xl text-white shadow-sm shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-base font-bold text-emerald-900">Deal Successfully Closed (Won)</h3>
                    <p className="text-xs text-emerald-700 font-semibold italic">"{journey.successRecord.successReason}"</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 text-xs text-emerald-800">
                      <div>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Revenue Generated</span>
                        <span className="font-extrabold text-xs">{formatCurrency(journey.successRecord.revenueGenerated)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Estimated Profit</span>
                        <span className="font-extrabold text-xs">{formatCurrency(journey.successRecord.profit)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Satisfaction Level</span>
                        <span className="font-bold text-xs">★ {journey.successRecord.customerSatisfactionRating}% Score</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Recommending Us</span>
                        <span className="font-bold text-xs">{journey.successRecord.wouldRecommend ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lost Issue Card (if lost) */}
            {lead.status === 'Closed Lost' && journey.issue && (
              <Card className="bg-rose-50 border-rose-200 overflow-hidden shadow-2xs">
                <CardContent className="p-6 flex items-start space-x-4">
                  <div className="p-3 bg-rose-500 rounded-xl text-white shadow-sm shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-base font-bold text-rose-900">Deal Closed (Lost)</h3>
                    <div className="text-xs text-rose-800 space-y-1">
                      <p><strong>Lost at Phase:</strong> {journey.issue.phaseLostAt}</p>
                      <p><strong>Date Lost:</strong> {journey.issue.dateLost}</p>
                      <p><strong>Lost Reason:</strong> {journey.issue.reason}</p>
                      <p><strong>Root Cause Assessment:</strong> {journey.issue.rootCause}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t border-rose-200/50 text-xs text-rose-800">
                      <div>
                        <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">Lost Deal Value</span>
                        <span className="font-extrabold text-xs">{formatCurrency(journey.issue.lostAmount || 0)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">Accountable Team Lead</span>
                        <span className="font-bold text-xs">
                          {teamLeaders.find(tl => tl.id === journey.issue.accountablePersonId || tl.teamId === journey.issue.accountablePersonId)?.name || 'Unassigned'}
                        </span>
                      </div>
                      {journey.issue.competitorName && (
                        <div>
                          <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">Lost To Competitor</span>
                          <span className="font-bold text-xs">{journey.issue.competitorName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Content Sections */}
            <LeadPhaseSection id="qualification" title="Phase 1: Lead Qualification">
              <QualificationSection 
                lead={lead} 
                onUpdate={handleUpdateQualification} 
              />
            </LeadPhaseSection>

            <LeadPhaseSection id="discovery" title="Phase 2: Discovery & Communication" noCard={true}>
              <DiscoverySection
                lead={lead}
                communications={journey.communications}
                requirements={journey.requirements}
                developers={teamDevs}
                onAddCommunication={handleAddCommunication}
                onAddRequirement={handleAddRequirement}
              />
            </LeadPhaseSection>

            <LeadPhaseSection id="solution" title="Phase 3: Solution & Proposal">
              <SolutionSection 
                proposal={journey.proposal} 
                onUpdate={handleUpdateProposal} 
              />
            </LeadPhaseSection>

            <LeadPhaseSection id="delivery" title="Phase 4: Delivery & Closure">
              <DeliverySection 
                delivery={journey.delivery} 
                onUpdate={handleUpdateDelivery} 
              />
            </LeadPhaseSection>

            <LeadPhaseSection id="success" title="Phase 5: Customer Success">
              <SuccessSection 
                customerSuccess={journey.customerSuccess} 
                onUpdate={handleUpdateCustomerSuccess} 
              />
            </LeadPhaseSection>
          </LeadContent>
        }
        timeline={
          <>
            <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-gray-200">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-gray-800 text-sm">Milestone Timeline</h3>
            </div>
            <LeadTimeline journey={journey} />
          </>
        }
      />

      {/* Won/Lost accountability modals */}
      <LeadStatusModal 
        isOpen={statusModalMode !== null}
        onClose={() => setStatusModalMode(null)}
        mode={statusModalMode}
        teamLeaders={teamLeaders}
        onSubmit={handleStatusModalSubmit}
      />
    </>
  );
}
